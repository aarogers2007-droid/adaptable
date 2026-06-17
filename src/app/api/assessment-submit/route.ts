import { createAdminClient } from "@/lib/supabase/admin";
import { validateOrigin } from "@/lib/csrf";
import { createHash } from "crypto";

// Public, unauthenticated submission endpoint for the /assessment page.
// Stores to assessment_submissions scoped to Adaptable org #0 (migration 00061).
const ADAPTABLE_ORG_ID = "00000000-0000-0000-0000-000000000001";
const MAX_SVG_BYTES = 400_000;
const MAX_ANSWER_CHARS = 5_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clampStr(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

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

  // Honeypot
  if (typeof body.company_website === "string" && body.company_website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) {
    return Response.json({ error: "Please add your name." }, { status: 400 });
  }

  let email: string | null = null;
  if (typeof body.email === "string" && body.email.trim() !== "") {
    const e = body.email.trim();
    if (e.length > 200 || !EMAIL_RE.test(e)) {
      return Response.json({ error: "That email doesn't look right." }, { status: 400 });
    }
    email = e;
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

  let drawing_svg: string | null = null;
  if (typeof body.drawing === "string" && body.drawing.trim()) {
    if (body.drawing.length > MAX_SVG_BYTES) {
      return Response.json({ error: "That drawing is too large." }, { status: 400 });
    }
    // Only accept something that looks like our SVG output.
    if (body.drawing.trim().startsWith("<svg")) drawing_svg = body.drawing;
  }

  const a = (body.answers ?? {}) as Record<string, unknown>;
  const answers = {
    kid: clampStr(a.kid, MAX_ANSWER_CHARS),
    geniuses: clampStr(a.geniuses, MAX_ANSWER_CHARS),
    rush: clampStr(a.rush, MAX_ANSWER_CHARS),
    build: clampStr(a.build, MAX_ANSWER_CHARS),
    deal: clampStr(a.deal, MAX_ANSWER_CHARS),
    arena: clampStr(a.arena, 40),
    arena_proof: clampStr(a.arena_proof, MAX_ANSWER_CHARS),
    truth: clampStr(a.truth, MAX_ANSWER_CHARS),
    surprise: clampStr(a.surprise, MAX_ANSWER_CHARS),
  };

  // Rate limit (fail closed), salted IP hash — same limiter as /ask.
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
    p_session_id: sessionId ?? `assess_${ipHash.slice(0, 12)}`,
  });
  if (gateError) {
    console.error("[assessment-submit] reserve_ask_usage error:", gateError.message);
    return new Response("Service temporarily unavailable", { status: 503 });
  }
  if (gate !== "ok") {
    return Response.json({ error: "Too many submissions — try again later." }, { status: 429 });
  }

  const { error: insertError } = await admin.from("assessment_submissions").insert({
    org_id: ADAPTABLE_ORG_ID,
    session_id: sessionId,
    name,
    email,
    drawing_svg,
    answers,
  });
  if (insertError) {
    console.error("[assessment-submit] insert failed:", insertError.message);
    return new Response("Could not save right now", { status: 500 });
  }

  return Response.json({ ok: true });
}
