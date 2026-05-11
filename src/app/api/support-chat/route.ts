import { createClient } from "@/lib/supabase/server";
import { sendMessageAuto } from "@/lib/ai";
import { getModel } from "@/lib/model-config";
import { moderateContent } from "@/lib/content-moderation";

function buildSupportPrompt(brandName: string) {
  return `You are the ${brandName} support assistant. You help students and teachers resolve issues with the platform quickly and clearly.

WHAT YOU KNOW:
- ${brandName} is an AI venture studio where students design real businesses
- Students complete an Ikigai wizard to discover their business idea (4 circles: passions, skills, needs, monetization)
- There are 22 lessons across 6 modules, taught by a conversational AI mentor
- Invention Mode is a separate flow with 5 circles (Wish, Mind, Lens, Scale, Voice) for group events
- Teachers have a dashboard with student progress, alerts, nudges, and class management
- Students join classes using invite codes (e.g., "VENTURE")
- The business card designer lets students customize their card after completing lessons
- The Founder's Mirror shows reflections after each lesson
- The completion ceremony and diploma appear after all 22 lessons

COMMON ISSUES AND FIXES:
- "I can't log in" → Check if using the correct email. Try Google sign-in. Clear browser cache.
- "My Ikigai won't generate" → Make sure all 4 steps have at least one selection. Try refreshing.
- "The lesson is stuck" → Refresh the page. If still stuck, try a different browser. Your progress is saved.
- "I can't see my class" → Ask your teacher for the invite code and go to /join to enter it.
- "My teacher can't see my progress" → Make sure you're enrolled in the right class. Check /join.
- "The AI isn't responding" → The AI has a daily message limit. Try again tomorrow, or ask your teacher to check.
- "How do I reset my business idea?" → Only your teacher or admin can reset your Ikigai. Ask them.
- "I got an error message" → Note the exact error text and describe what you were doing when it appeared.
- "The page looks broken on my Chromebook" → Try refreshing. If the layout is off, press Ctrl+0 to reset zoom.
- "I can't find my group number" → Go back to /invention — your group number appears after groups are revealed.
- "How do I change my business name?" → You can edit it in the wizard or ask your teacher to reset your Ikigai.

RULES:
1. Be warm, direct, and helpful. These are students ages 11-18 and their teachers.
2. If you can solve the issue with instructions, do it in 2-3 short sentences.
3. If the issue requires admin action (account reset, data fix, bug report), say: "I'll flag this for AJ to look at. He usually responds within a few hours."
4. Never ask for passwords, personal info, or full names.
5. If the user seems frustrated, acknowledge it: "I hear you, that's annoying. Let me help."
6. If you genuinely don't know the answer, say so honestly and escalate.
7. Keep responses under 100 words unless the issue requires detailed steps.

ESCALATION TRIGGER:
If the issue cannot be resolved with the instructions above, respond normally but end your message with the exact tag [ESCALATE] on its own line. This signals the system to log the issue for manual review. Do not tell the user about this tag.`;
}

// Rate limiting uses the database-backed reserve_ai_usage RPC
// (same pattern as chat, lesson-chat, and customer-interview routes).
// The previous in-memory Map did not persist across Vercel serverless invocations.

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { message, conversationId } = await request.json();

  if (!message || typeof message !== "string" || message.length > 2000) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }

  // Rate limit (database-backed, persists across serverless invocations)
  const { data: allowed, error: rpcError } = await supabase.rpc("reserve_ai_usage", {
    p_student_id: user.id,
    p_feature: "support",
  });
  if (rpcError) {
    console.error("[support-chat] rate limit RPC error:", rpcError);
    return Response.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
  if (!allowed) {
    return Response.json({ error: "You've sent a lot of messages. Try again in a bit." }, { status: 429 });
  }

  // Content moderation (regex)
  const modCheck = moderateContent(message);
  if (!modCheck.safe) {
    return Response.json({ error: modCheck.reason }, { status: 400 });
  }

  // ML moderation
  const { moderateContentML } = await import("@/lib/ml-moderation");
  const mlCheck = await moderateContentML(message);
  if (!mlCheck.safe) {
    return Response.json({ error: "That message couldn't be sent. Try rephrasing." }, { status: 400 });
  }

  // Crisis detection (non-blocking)
  const { detectCrisisUniversal } = await import("@/lib/crisis-detection");
  detectCrisisUniversal(message).then(async (crisisCheck) => {
    if (!crisisCheck.detected) return;
    const { alertCrisis } = await import("@/lib/teacher-alerts");
    await alertCrisis(supabase, user.id, crisisCheck.type ?? "hopelessness", crisisCheck.matchedPattern ?? "", message, "support-chat");
  }).catch(() => {});

  // Get user info for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, org_id")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name ?? "User";
  const userRole = profile?.role ?? "student";

  // Fetch org brand name for the support prompt
  const { getOrgBrandName } = await import("@/lib/get-tenant-branding");
  const brandName = await getOrgBrandName((profile as Record<string, unknown>)?.org_id as string | null);

  // Load or create conversation
  let convoId = conversationId;
  let history: { role: string; content: string }[] = [];

  if (convoId) {
    const { data: convo } = await supabase
      .from("support_conversations")
      .select("messages")
      .eq("id", convoId)
      .eq("user_id", user.id)
      .single();
    if (convo) {
      history = (convo.messages as { role: string; content: string }[]) ?? [];
    }
  }

  // Build messages for Claude
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // Call AI (non-streaming for simplicity in support chat)
  const result = await sendMessageAuto({
    model: getModel("support"),
    maxTokens: 800,
    systemPrompt: buildSupportPrompt(brandName) + `\n\nUser: ${userName} (${userRole})`,
    messages,
  });

  const aiResponse = result.text;
  const shouldEscalate = aiResponse.includes("[ESCALATE]");
  const cleanResponse = aiResponse.replace(/\n?\[ESCALATE\]\n?/g, "").trim();

  // Update conversation history
  const updatedHistory = [
    ...history,
    { role: "user", content: message },
    { role: "assistant", content: cleanResponse },
  ];

  // Save or create conversation
  if (convoId) {
    await supabase
      .from("support_conversations")
      .update({
        messages: updatedHistory,
        message_count: updatedHistory.length,
        escalated: shouldEscalate || undefined,
      })
      .eq("id", convoId);
  } else {
    const { data: newConvo } = await supabase
      .from("support_conversations")
      .insert({
        user_id: user.id,
        messages: updatedHistory,
        message_count: updatedHistory.length,
        escalated: shouldEscalate,
      })
      .select("id")
      .single();
    convoId = newConvo?.id;
  }

  // Handle escalation
  if (shouldEscalate && convoId) {
    // Build a summary of the issue from the last few messages
    const recentMessages = updatedHistory.slice(-4);
    const summary = recentMessages
      .map((m) => `${m.role === "user" ? userName : "Support AI"}: ${m.content}`)
      .join("\n");

    await supabase.from("support_escalations").insert({
      conversation_id: convoId,
      user_id: user.id,
      user_name: userName,
      user_role: userRole,
      summary: summary.slice(0, 2000),
    });

    // Try to email AJ (non-blocking, may fail if Resend not configured)
    try {
      const { sendSupportEscalationEmail } = await import("@/lib/email-support");
      await sendSupportEscalationEmail({
        userName,
        userRole,
        summary: summary.slice(0, 500),
      });
    } catch {
      // Resend not configured — that's fine, escalation is still logged in DB
    }
  }

  return Response.json({
    response: cleanResponse,
    conversationId: convoId,
    escalated: shouldEscalate,
  });
}
