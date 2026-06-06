"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCardContent, type CardContent } from "@/lib/generate-card";
import { MODEL_MAP } from "@/lib/ai";
import { getModel } from "@/lib/model-config";
import { randomBytes } from "crypto";

// ── Semaphore: limit concurrent Claude card generation calls ──

const MAX_CONCURRENT = 10;
const MAX_QUEUE_DEPTH = 50;
const SEMAPHORE_TIMEOUT_MS = 30_000;
let activeCount = 0;
const waitQueue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

function acquireSemaphore(): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  if (waitQueue.length >= MAX_QUEUE_DEPTH) {
    return Promise.reject(new Error("Server busy — too many cards generating simultaneously"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = waitQueue.findIndex((e) => e.resolve === resolve);
      if (idx !== -1) waitQueue.splice(idx, 1);
      reject(new Error("Card generation queue timeout"));
    }, SEMAPHORE_TIMEOUT_MS);

    waitQueue.push({
      resolve: () => {
        clearTimeout(timer);
        activeCount++;
        resolve();
      },
      reject,
    });
  });
}

function releaseSemaphore(): void {
  activeCount--;
  const next = waitQueue.shift();
  if (next) next.resolve();
}

// ── Slug generation ──

function generateSlug(): string {
  return randomBytes(8).toString("base64url").slice(0, 10);
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("invention_sessions")
      .select("id")
      .eq("generated_card->>shareable_slug", slug)
      .limit(1);
    if (error) {
      console.warn("[card-action] Slug uniqueness check failed, assuming unique:", error.message);
    }
    if (!data || data.length === 0) return slug;
  }
  // 5 collisions in a row with 10-char base64url is astronomically unlikely
  // but handle it gracefully
  return randomBytes(8).toString("base64url").slice(0, 12);
}

// ── Auth check ──

async function verifyCardAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionRow: { student_id: string; class_code: string }
): Promise<boolean> {
  // Owner of the session
  if (sessionRow.student_id === userId) return true;

  // Check if user is instructor/admin of the class
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_platform_owner")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  // Platform owner can access anything
  if (profile.is_platform_owner) return true;

  // Instructor or org_admin — verify they own the class
  if (profile.role === "instructor" || profile.role === "org_admin") {
    const { data: inviteCode } = await supabase
      .from("invite_codes")
      .select("class_id, classes!inner(instructor_id)")
      .eq("code", sessionRow.class_code)
      .limit(1)
      .single();

    if (inviteCode) {
      const cls = inviteCode.classes as unknown as { instructor_id: string };
      if (cls.instructor_id === userId) return true;
    }

    // Check co-admin
    const { data: classData } = await supabase
      .from("invite_codes")
      .select("class_id, classes!inner(grouping_config)")
      .eq("code", sessionRow.class_code)
      .limit(1)
      .single();

    if (classData) {
      const config = (classData.classes as unknown as { grouping_config: Record<string, unknown> | null })?.grouping_config;
      const coAdmins = (config?.co_admin_ids as string[]) ?? [];
      if (coAdmins.includes(userId)) return true;
    }
  }

  return false;
}

// ── Main server action ──

export interface GenerateCardResult {
  card: (CardContent & {
    shareable_slug: string;
    generated_at: string;
    model_used: string;
    grade_tier: string;
  }) | null;
  error: string | null;
  already_existed: boolean;
}

export async function generateStudentCard(sessionId: string): Promise<GenerateCardResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { card: null, error: "Not authenticated", already_existed: false };

  // 1. Fetch the session
  const { data: session, error: fetchErr } = await supabase
    .from("invention_sessions")
    .select("student_id, class_code, circle_1_category, circle_2_archetype, circle_3_chips, circle_3_freetext, circle_4_scale, circle_5_voice, generated_card")
    .eq("id", sessionId)
    .single();

  if (fetchErr || !session) {
    return { card: null, error: "Session not found", already_existed: false };
  }

  // 2. Auth check
  const hasAccess = await verifyCardAccess(supabase, user.id, session);
  if (!hasAccess) {
    return { card: null, error: "Access denied", already_existed: false };
  }

  // 3. Idempotency — if card already exists, return it
  if (session.generated_card) {
    return {
      card: session.generated_card as GenerateCardResult["card"],
      error: null,
      already_existed: true,
    };
  }

  // 4. Completeness check
  const missing: string[] = [];
  if (!session.circle_1_category) missing.push("Circle 1 (The Wish)");
  if (!session.circle_2_archetype) missing.push("Circle 2 (The Mind)");
  if (!session.circle_3_chips || session.circle_3_chips.length === 0) missing.push("Circle 3 (The Lens)");
  if (!session.circle_4_scale) missing.push("Circle 4 (The Scale)");
  if (!session.circle_5_voice || session.circle_5_voice.length === 0) missing.push("Circle 5 (The Voice)");

  if (missing.length > 0) {
    return {
      card: null,
      error: `Incomplete session — missing: ${missing.join(", ")}`,
      already_existed: false,
    };
  }

  // 5. Fetch grade_tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("grade_tier, org_id")
    .eq("id", session.student_id)
    .single();

  const gradeTier = (profile?.grade_tier as string) ?? "high_school";

  // 6. Rate limit — only enforce when the student is calling for themselves.
  // Admin/instructor-initiated generation (backfill, manual trigger) skips the
  // RPC because reserve_ai_usage requires auth.uid() == p_student_id.
  // Idempotency (steps 3 + 12) is the real guard against duplicate generation.
  const isCallerTheStudent = user.id === session.student_id;
  if (isCallerTheStudent) {
    const { data: reservation } = await supabase.rpc("reserve_ai_usage", {
      p_student_id: session.student_id,
      p_feature: "card",
    });

    if (reservation === false) {
      return {
        card: null,
        error: "Daily AI limit reached. Your card will be ready tomorrow.",
        already_existed: false,
      };
    }
  }

  // 7-9. Acquire semaphore, generate card via Claude
  try {
    await acquireSemaphore();
  } catch (semErr) {
    console.warn("[card-action] Semaphore rejected:", semErr instanceof Error ? semErr.message : semErr);
    return {
      card: null,
      error: "We're processing a lot of cards right now. Check back in a moment.",
      already_existed: false,
    };
  }
  try {
    const result = await generateCardContent({
      circle_1_category: session.circle_1_category!,
      circle_2_archetype: session.circle_2_archetype!,
      circle_3_chips: session.circle_3_chips!,
      circle_3_freetext: session.circle_3_freetext,
      circle_4_scale: session.circle_4_scale!,
      circle_5_voice: session.circle_5_voice!,
      grade_tier: gradeTier,
    });

    if (!result.card) {
      console.error("[card-action] Generation failed:", result.error);
      return {
        card: null,
        error: "Card generation failed. Please try again.",
        already_existed: false,
      };
    }

    // 10. Generate unique shareable slug
    const shareableSlug = await generateUniqueSlug(supabase);

    // 11. Assemble final card object
    const fullCard = {
      ...result.card,
      shareable_slug: shareableSlug,
      generated_at: new Date().toISOString(),
      model_used: MODEL_MAP.card,
      grade_tier: gradeTier,
    };

    // 12. Store in database
    // Re-check idempotency before writing (another request may have completed)
    const { data: recheck } = await supabase
      .from("invention_sessions")
      .select("generated_card")
      .eq("id", sessionId)
      .single();

    if (recheck?.generated_card) {
      return {
        card: recheck.generated_card as GenerateCardResult["card"],
        error: null,
        already_existed: true,
      };
    }

    const { error: updateErr } = await supabase
      .from("invention_sessions")
      .update({ generated_card: fullCard })
      .eq("id", sessionId);

    if (updateErr) {
      console.error("[card-action] DB update failed:", updateErr);
      return {
        card: null,
        error: "Failed to save card. Please try again.",
        already_existed: false,
      };
    }

    // Log usage
    try {
      await supabase.from("ai_usage_log").insert({
        student_id: session.student_id,
        org_id: profile?.org_id ?? null,
        feature: "card",
        model: getModel("card_generation"),
        input_tokens: result.usage?.input_tokens ?? 0,
        output_tokens: result.usage?.output_tokens ?? 0,
        estimated_cost_usd: 0,
      });
    } catch (e) {
      console.error("Failed to log ai_usage for card:", e);
    }

    // 13. Send parent email (non-blocking, fire-and-forget)
    sendParentCardEmail(supabase, session.student_id, shareableSlug, sessionId).catch((err) => {
      console.warn("[card-action] Parent email failed (non-blocking):", err);
    });

    // 14. Return
    return {
      card: fullCard,
      error: null,
      already_existed: false,
    };
  } finally {
    releaseSemaphore();
  }
}

/**
 * Backfill cards for all complete sessions in a class that don't have one yet.
 * Platform owner only. Sequential with 600ms delay between calls.
 */
export async function backfillClassCards(classCode: string): Promise<{
  generated: number;
  failed: number;
  total: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { generated: 0, failed: 0, total: 0, errors: ["Not authenticated"] };

  // Platform owner check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_owner) {
    return { generated: 0, failed: 0, total: 0, errors: ["Platform owner access required"] };
  }

  // Find all complete sessions without cards
  const { data: sessions } = await supabase
    .from("invention_sessions")
    .select("id")
    .eq("class_code", classCode)
    .not("completed_at", "is", null)
    .is("generated_card", null)
    .not("circle_1_category", "is", null)
    .not("circle_2_archetype", "is", null)
    .not("circle_4_scale", "is", null);

  if (!sessions || sessions.length === 0) {
    return { generated: 0, failed: 0, total: 0, errors: [] };
  }

  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const session of sessions) {
    const result = await generateStudentCard(session.id);
    if (result.card) {
      generated++;
    } else {
      failed++;
      errors.push(`${session.id}: ${result.error}`);
    }
    // 600ms delay between calls to respect rate limits
    if (sessions.indexOf(session) < sessions.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  return { generated, failed, total: sessions.length, errors };
}

/**
 * Send parent email for a newly generated card.
 * Only sends to verified parent emails from the COPPA consent flow.
 * Idempotent — checks sent_parent_email_at in the JSONB before sending.
 */
async function sendParentCardEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  shareableSlug: string,
  sessionId: string,
): Promise<void> {
  // Check if email already sent (idempotency via JSONB field)
  const { data: session } = await supabase
    .from("invention_sessions")
    .select("generated_card")
    .eq("id", sessionId)
    .single();

  const card = session?.generated_card as Record<string, unknown> | null;
  if (card?.sent_parent_email_at) return; // already sent

  // Find verified parent email from COPPA consent
  const { data: consent } = await supabase
    .from("student_consent")
    .select("consenting_party_email")
    .eq("student_id", studentId)
    .eq("consent_type", "parental_verified")
    .is("revoked_at", null)
    .limit(1)
    .single();

  if (!consent?.consenting_party_email) return; // no verified parent email

  // Get student first name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Your child";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://adaptable.one";
  const shareableUrl = `${siteUrl}/c/${shareableSlug}`;

  const { sendCardReadyEmail } = await import("@/lib/email");
  const result = await sendCardReadyEmail({
    to: consent.consenting_party_email,
    studentFirstName: firstName,
    shareableUrl,
  });

  if (result.ok) {
    // Mark email as sent in the JSONB
    await supabase
      .from("invention_sessions")
      .update({
        generated_card: { ...card, sent_parent_email_at: new Date().toISOString() },
      })
      .eq("id", sessionId);
  }
}
