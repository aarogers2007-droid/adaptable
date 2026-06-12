import { createAdminClient } from "@/lib/supabase/admin";
import { validateOrigin } from "@/lib/csrf";
import { createHash } from "crypto";

// Public, unauthenticated lead capture for the /ask Spokesperson.
// Stores to faq_leads scoped to Adaptable org #0 (migration 00060).
const ADAPTABLE_ORG_ID = "00000000-0000-0000-0000-000000000001";
const MAX_TRANSCRIPT_BYTES = 16_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Turn = { role: string; content: string };

export async function POST(request: Request) {
  if (process.env.ASK_ENDPOINT_ENABLED === "false") {
    return new Response("Temporarily unavailable", { status: 503 });
  }
  if (!validateOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Honeypot: a hidden field real users never fill. If set, silently accept
  // (200) without storing — don't tell the bot it was caught.
  if (typeof body.company_website === "string" && body.company_website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;
  if (!name || name.length > 100) {
    return Response.json({ error: "A first name is required." }, { status: 400 });
  }

  // Email is optional; if present it must be valid.
  let email: string | null = null;
  if (typeof body.email === "string" && body.email.trim() !== "") {
    const e = body.email.trim();
    if (e.length > 200 || !EMAIL_RE.test(e)) {
      return Response.json({ error: "That email doesn't look right." }, { status: 400 });
    }
    email = e;
  }
  const orgName =
    typeof body.org === "string" && body.org.trim() ? body.org.trim().slice(0, 200) : null;
  const note =
    typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  const consent = body.consent === true;

  // Transcript: cap size, keep only role/content text.
  let transcript: Turn[] | null = null;
  if (Array.isArray(body.transcript)) {
    const turns = (body.transcript as unknown[])
      .filter(
        (t): t is Turn =>
          !!t && typeof t === "object" && typeof (t as Turn).content === "string"
      )
      .map((t) => ({ role: String(t.role).slice(0, 16), content: t.content.slice(0, 4000) }));
    let json = JSON.stringify(turns);
    while (json.length > MAX_TRANSCRIPT_BYTES && turns.length > 0) {
      turns.shift(); // drop oldest until under cap
      json = JSON.stringify(turns);
    }
    transcript = turns.length ? turns : null;
  }

  // Rate limit (fail closed) — reuse the message limiter so lead spam is bounded
  // by the same per-IP / global caps. Salted IP hash (CSO finding #2).
  const { headers } = await import("next/headers");
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipSalt =
    process.env.ASK_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "ask-rate-limit";
  const ipHash = createHash("sha256").update(`${ipSalt}:ask:${ip}`).digest("hex");

  const admin = createAdminClient();
  const { data: gate, error: gateError } = await admin.rpc("reserve_ask_usage", {
    p_ip_hash: ipHash,
    p_session_id: sessionId ?? `lead_${ipHash.slice(0, 12)}`,
  });
  if (gateError) {
    console.error("[ask-lead] reserve_ask_usage error:", gateError.message);
    return new Response("Service temporarily unavailable", { status: 503 });
  }
  if (gate !== "ok") {
    return Response.json({ error: "Too many requests — try again later." }, { status: 429 });
  }

  const { error: insertError } = await admin.from("faq_leads").insert({
    org_id: ADAPTABLE_ORG_ID,
    session_id: sessionId,
    name,
    email,
    org_name: orgName,
    note,
    transcript,
    consent,
  });
  if (insertError) {
    console.error("[ask-lead] insert failed:", insertError.message);
    return new Response("Could not save right now", { status: 500 });
  }

  return Response.json({ ok: true });
}
