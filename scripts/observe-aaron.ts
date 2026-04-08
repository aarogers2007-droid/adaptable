/**
 * observe-aaron.ts — autonomous UX observer
 *
 * Watches Aaron's session in real time. On every detected state change
 * (new chat message, lesson progress, decision, feedback, etc), captures
 * a screenshot of the UI he's actually looking at by impersonating his
 * session via a passwordless admin OTP (does NOT touch his real password
 * or invalidate his active JWT). Sends the screenshot + state context to
 * Opus 4.6 — a different model from the one driving this work — for an
 * outside-voice UX/UI critique.
 *
 * Findings are written to:
 *   ~/aaron-observations.jsonl  — every observation, append-only
 *   ~/aaron-alerts.txt          — high+ severity issues, plain text
 *   ~/aaron-observer.log        — human-readable run log
 *
 * No user input. No rate limit. No budget cap (per AJ's instruction).
 * Stops after AARON_IDLE_MIN minutes of no detected state change.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { homedir } from "os";
import path from "path";
import { spawnSync } from "child_process";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[t.slice(0, i).trim()] = v;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ── Config ─────────────────────────────────────────────────────────────
const AARON_ID = "e358a06e-225a-4d29-a918-f542126accc9";
const AARON_EMAIL = "aaronmarquez789@icloud.com";
const BASE_URL = "https://adaptable-aarogers2007-droids-projects.vercel.app";
const POLL_INTERVAL_MS = 15000;        // 15s between polls
const PERIODIC_REVIEW_MS = 90000;       // every 90s, review even with no change
const AARON_IDLE_MIN = 30;             // stop after 30 min of no activity
const JUDGE_MODEL = "claude-opus-4-6"; // outside voice

const HOME = homedir();
const OBS_FILE = path.join(HOME, "aaron-observations.jsonl");
const ALERT_FILE = path.join(HOME, "aaron-alerts.txt");
const LOG_FILE = path.join(HOME, "aaron-observer.log");

// ── Logging ────────────────────────────────────────────────────────────
function ts() { return new Date().toISOString(); }
function log(msg: string) {
  const line = `[${ts()}] ${msg}`;
  process.stderr.write(line + "\n");
  appendFileSync(LOG_FILE, line + "\n");
}

// ── Browse helper ──────────────────────────────────────────────────────
const BROWSE_BIN = path.join(HOME, ".claude/skills/gstack/browse/dist/browse");
function browse(...args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync(BROWSE_BIN, args, { encoding: "utf-8", timeout: 30000 });
  return { ok: r.status === 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// ── State capture ──────────────────────────────────────────────────────
interface AaronState {
  profile: {
    full_name: string | null;
    business_idea: { name?: string; niche?: string } | null;
    ikigai_draft: unknown;
    updated_at: string;
  };
  conversations: { id: string; lesson_id: string | null; messages: unknown; message_count: number; updated_at: string }[];
  progress: { lesson_id: string; status: string; checkpoints_reached: unknown; updated_at: string }[];
  decisions: { id: string; lesson_id: string; decision_text: string; created_at: string }[];
  feedback: { id: string; message: string; rating: number | null; created_at: string }[];
}

async function fetchAaronState(sbAdmin: SupabaseClient): Promise<AaronState> {
  const [profileRes, convRes, progRes, decRes, fbRes] = await Promise.all([
    sbAdmin.from("profiles").select("full_name, business_idea, ikigai_draft, updated_at").eq("id", AARON_ID).single(),
    sbAdmin.from("ai_conversations").select("id, lesson_id, messages, message_count, updated_at").eq("student_id", AARON_ID).order("updated_at", { ascending: false }).limit(3),
    sbAdmin.from("student_progress").select("lesson_id, status, checkpoints_reached, updated_at").eq("student_id", AARON_ID).order("updated_at", { ascending: false }).limit(5),
    sbAdmin.from("lesson_decisions").select("id, lesson_id, decision_text, created_at").eq("student_id", AARON_ID).order("created_at", { ascending: false }).limit(5),
    sbAdmin.from("feedback").select("id, message, rating, created_at").eq("user_id", AARON_ID).order("created_at", { ascending: false }).limit(3),
  ]);

  return {
    profile: (profileRes.data ?? { full_name: null, business_idea: null, ikigai_draft: null, updated_at: "" }) as AaronState["profile"],
    conversations: (convRes.data ?? []) as AaronState["conversations"],
    progress: (progRes.data ?? []) as AaronState["progress"],
    decisions: (decRes.data ?? []) as AaronState["decisions"],
    feedback: (fbRes.data ?? []) as AaronState["feedback"],
  };
}

function stateHash(s: AaronState): string {
  return JSON.stringify({
    name: s.profile.business_idea?.name ?? null,
    convCounts: s.conversations.map((c) => `${c.id}:${c.message_count}`).join("|"),
    progress: s.progress.map((p) => `${p.lesson_id}:${p.status}:${(p.checkpoints_reached as unknown[] | null)?.length ?? 0}`).join("|"),
    decisionIds: s.decisions.map((d) => d.id).join("|"),
    feedbackIds: s.feedback.map((f) => f.id).join("|"),
  });
}

// ── Where is Aaron right now? ──────────────────────────────────────────
function inferLocation(s: AaronState): { url: string; label: string } {
  // No business idea → still on onboarding wizard
  if (!s.profile.business_idea) {
    return { url: `${BASE_URL}/onboarding`, label: "ikigai-wizard" };
  }
  // Most recent activity is a conversation → he's in that lesson
  const latestConv = s.conversations[0];
  if (latestConv && latestConv.lesson_id) {
    const convDate = new Date(latestConv.updated_at).getTime();
    const recentMs = Date.now() - convDate;
    if (recentMs < 10 * 60 * 1000) {
      return { url: `${BASE_URL}/lessons/${latestConv.lesson_id}`, label: `lesson-${latestConv.lesson_id.slice(0, 8)}` };
    }
  }
  // Most recent progress row → he was last on that lesson
  const latestProg = s.progress[0];
  if (latestProg) {
    const progDate = new Date(latestProg.updated_at).getTime();
    const recentMs = Date.now() - progDate;
    if (recentMs < 10 * 60 * 1000) {
      return { url: `${BASE_URL}/lessons/${latestProg.lesson_id}`, label: `lesson-${latestProg.lesson_id.slice(0, 8)}` };
    }
  }
  // Default: dashboard
  return { url: `${BASE_URL}/dashboard`, label: "dashboard" };
}

// ── Impersonation: mint a JWT for Aaron without touching his password ──
async function mintAaronSession(sbAdmin: SupabaseClient): Promise<{ jwt: string; refreshToken: string } | null> {
  const { data, error } = await sbAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: AARON_EMAIL,
  });
  if (error || !data.properties?.hashed_token) {
    log(`mintAaronSession failed: ${error?.message ?? "no token"}`);
    return null;
  }
  const sbAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: verifyData, error: verifyErr } = await sbAnon.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  if (verifyErr || !verifyData.session) {
    log(`verifyOtp failed: ${verifyErr?.message ?? "no session"}`);
    return null;
  }
  return {
    jwt: verifyData.session.access_token,
    refreshToken: verifyData.session.refresh_token,
  };
}

// ── Set browse cookies to Aaron's session, navigate, screenshot ───────
const cookieJsonPath = "/tmp/aaron-cookies.json";

async function captureAaronView(jwt: string, refreshToken: string, url: string, label: string): Promise<{
  screenshotPath: string;
  pageText: string;
} | null> {
  // Build a Supabase ssr cookie. The Next app uses @supabase/ssr which stores
  // the session as a base64-encoded JSON in a cookie named
  // sb-<projectref>-auth-token. We need to construct that.
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/https:\/\/([^.]+)\./)?.[1];
  if (!projectRef) {
    log("could not extract project ref from SUPABASE_URL");
    return null;
  }

  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionPayload = {
    access_token: jwt,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: AARON_ID, email: AARON_EMAIL },
  };
  const cookieValue = "base64-" + Buffer.from(JSON.stringify(sessionPayload)).toString("base64");

  // Write cookies file in the format browse cookie-import expects
  const cookies = [
    {
      name: cookieName,
      value: cookieValue,
      domain: "adaptable-aarogers2007-droids-projects.vercel.app",
      path: "/",
      expires: Math.floor(Date.now() / 1000) + 3600,
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
    },
  ];
  writeFileSync(cookieJsonPath, JSON.stringify(cookies));

  // Set viewport to mobile (Aaron is on iPhone)
  browse("viewport", "375x812");
  const importRes = browse("cookie-import", cookieJsonPath);
  if (!importRes.ok) {
    log(`cookie-import failed: ${importRes.stderr.slice(0, 100)}`);
  }

  const gotoRes = browse("goto", url);
  if (!gotoRes.ok) {
    log(`goto ${url} failed: ${gotoRes.stderr.slice(0, 100)}`);
    return null;
  }
  // Wait for page to settle
  spawnSync("sleep", ["2"]);
  browse("wait", "--networkidle");

  const screenshotPath = `/tmp/aaron-${label}-${Date.now()}.png`;
  const shotRes = browse("screenshot", screenshotPath);
  if (!shotRes.ok) {
    log(`screenshot failed: ${shotRes.stderr.slice(0, 100)}`);
    return null;
  }

  const textRes = browse("text");
  return {
    screenshotPath,
    pageText: textRes.stdout.slice(0, 4000),
  };
}

// ── Opus UX critique ───────────────────────────────────────────────────
const anthropic = new Anthropic();

interface OpusFinding {
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  description: string;
  suggested_fix: string | null;
  is_blocking: boolean;
}

interface OpusReview {
  findings: OpusFinding[];
  overall: string;
}

async function reviewWithOpus(state: AaronState, location: { url: string; label: string }, screenshotPath: string | null, pageText: string): Promise<OpusReview | null> {
  const stateSummary = `
Aaron's current state on Adaptable:
- Name: ${state.profile.full_name}
- Business: ${state.profile.business_idea?.name ?? "(none yet)"} — ${state.profile.business_idea?.niche ?? ""}
- URL he's likely on: ${location.url}
- Page label: ${location.label}
- Recent conversations: ${state.conversations.length} (latest message_count: ${state.conversations[0]?.message_count ?? 0})
- Recent progress rows: ${state.progress.length}
- Recent decisions: ${state.decisions.length}
- Recent feedback rows: ${state.feedback.length}

Latest conversation messages (last 3):
${state.conversations[0]?.messages ? JSON.stringify((state.conversations[0].messages as unknown[]).slice(-3)).slice(0, 1500) : "(none)"}

Latest progress: ${state.progress[0] ? `lesson ${state.progress[0].lesson_id.slice(0, 8)}, status: ${state.progress[0].status}, checkpoints: ${(state.progress[0].checkpoints_reached as unknown[] | null)?.length ?? 0}` : "(none)"}

Latest feedback message: ${state.feedback[0]?.message ?? "(none)"}

Visible page text (first 4K chars):
${pageText}
`;

  const systemPrompt = `You are an outside UX/UI reviewer watching a real teenager named Aaron use Adaptable, an AI-native venture studio platform built for teens. Aaron is using his iPhone (375x812 viewport).

Your job: spot ANYTHING that looks wrong, confusing, broken, ugly, or unnecessarily friction-heavy in his current experience. You are NOT building the product. You are NOT defending design decisions. You are watching Aaron and pointing out anything a smart 16-year-old would find off-putting, unclear, or broken.

Be ruthless. Be specific. Don't hedge. If something is fine, say "no findings" — don't manufacture issues.

For each issue, return:
- severity: "low" (cosmetic), "medium" (annoying), "high" (confusing or limiting), "critical" (broken / blocks progress)
- category: short noun (e.g. "layout", "copy", "interaction", "state", "performance", "safety", "trust")
- description: 1-2 sentences, specific
- suggested_fix: concrete suggestion if you have one, null otherwise
- is_blocking: true if Aaron literally cannot proceed without this being fixed

Return ONLY a JSON object:
{
  "findings": [
    { "severity": "...", "category": "...", "description": "...", "suggested_fix": "...", "is_blocking": false }
  ],
  "overall": "1 sentence on his current state"
}

If nothing is wrong: { "findings": [], "overall": "..." }
JSON only.`;

  const messages: Anthropic.MessageParam[] = [];

  if (screenshotPath && existsSync(screenshotPath)) {
    const imageData = readFileSync(screenshotPath);
    const base64 = imageData.toString("base64");
    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: base64,
          },
        },
        {
          type: "text",
          text: stateSummary,
        },
      ],
    });
  } else {
    messages.push({ role: "user", content: stateSummary });
  }

  try {
    const res = await anthropic.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    let clean = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const first = clean.indexOf("{");
    const last = clean.lastIndexOf("}");
    if (first !== -1 && last !== -1) clean = clean.slice(first, last + 1);
    return JSON.parse(clean) as OpusReview;
  } catch (e) {
    log(`opus review failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

// ── Persist findings ───────────────────────────────────────────────────
function recordObservation(state: AaronState, location: { url: string; label: string }, review: OpusReview, screenshotPath: string | null) {
  const obs = {
    ts: ts(),
    location,
    business_name: state.profile.business_idea?.name ?? null,
    last_message_count: state.conversations[0]?.message_count ?? 0,
    screenshot: screenshotPath,
    review,
  };
  appendFileSync(OBS_FILE, JSON.stringify(obs) + "\n");

  // Alert on high+ severity
  const alerts = review.findings.filter((f) => f.severity === "high" || f.severity === "critical");
  if (alerts.length > 0) {
    const alertText = `\n========== ${ts()} ==========
LOCATION: ${location.label} (${location.url})
BUSINESS: ${state.profile.business_idea?.name ?? "(none)"}
SCREENSHOT: ${screenshotPath ?? "(none)"}

OPUS OVERALL: ${review.overall}

FINDINGS:
${alerts.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] [${f.category}]${f.is_blocking ? " [BLOCKING]" : ""}
   ${f.description}
   ${f.suggested_fix ? "FIX: " + f.suggested_fix : "(no fix suggested)"}
`).join("\n")}
`;
    appendFileSync(ALERT_FILE, alertText);
    log(`🚨 ${alerts.length} high+ alerts written to ${ALERT_FILE}`);
  } else if (review.findings.length > 0) {
    log(`(${review.findings.length} low/medium findings logged)`);
  } else {
    log(`✅ no findings — ${review.overall}`);
  }
}

// ── Main loop ──────────────────────────────────────────────────────────
async function main() {
  log(`=== observe-aaron starting ===`);
  log(`watching ${AARON_EMAIL} (${AARON_ID})`);
  log(`base url: ${BASE_URL}`);
  log(`poll: ${POLL_INTERVAL_MS}ms · review: ${PERIODIC_REVIEW_MS}ms · idle stop: ${AARON_IDLE_MIN}m`);

  // Reset alert file for fresh run
  writeFileSync(ALERT_FILE, `# Aaron observer alerts — started ${ts()}\n`);

  const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Mint Aaron's observer JWT once at startup. Refresh if it expires.
  let session = await mintAaronSession(sbAdmin);
  if (!session) {
    log("FATAL: could not mint observer session");
    process.exit(1);
  }
  log(`✅ minted observer JWT for aaron`);
  let sessionMintedAt = Date.now();

  let lastHash = "";
  let lastChangeAt = Date.now();
  let lastReviewAt = 0;

  while (true) {
    // Refresh JWT every 50 minutes (sessions are 1 hour)
    if (Date.now() - sessionMintedAt > 50 * 60 * 1000) {
      log("refreshing observer JWT...");
      const fresh = await mintAaronSession(sbAdmin);
      if (fresh) { session = fresh; sessionMintedAt = Date.now(); }
    }

    const state = await fetchAaronState(sbAdmin);
    const hash = stateHash(state);
    const stateChanged = hash !== lastHash;
    const periodic = Date.now() - lastReviewAt > PERIODIC_REVIEW_MS;

    if (stateChanged) {
      log(`state change detected → ${state.conversations[0]?.message_count ?? 0} msgs, ${state.progress.length} progress rows`);
      lastChangeAt = Date.now();
    }

    if (stateChanged || periodic) {
      const location = inferLocation(state);
      log(`reviewing: ${location.label}`);
      const captured = await captureAaronView(session.jwt, session.refreshToken, location.url, location.label);
      const review = await reviewWithOpus(
        state,
        location,
        captured?.screenshotPath ?? null,
        captured?.pageText ?? ""
      );
      if (review) {
        recordObservation(state, location, review, captured?.screenshotPath ?? null);
      }
      lastReviewAt = Date.now();
      lastHash = hash;
    }

    // Idle stop
    if (Date.now() - lastChangeAt > AARON_IDLE_MIN * 60 * 1000) {
      log(`stopping: idle for ${AARON_IDLE_MIN} minutes`);
      break;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  log(`=== observe-aaron complete ===`);
  process.exit(0);
}

main().catch((e) => {
  log(`FATAL: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
