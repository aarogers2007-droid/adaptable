"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessageAuto } from "@/lib/ai";
import { getModel } from "@/lib/model-config";
import { moderateContent } from "@/lib/content-moderation";

export async function submitCheckIn(prompt: string, response: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate
  const trimmed = response.trim();
  if (!trimmed) return { error: "Please write something before submitting." };
  if (trimmed.length > 1000)
    return { error: "Keep it under 1000 characters." };

  // Moderate
  const modResult = moderateContent(trimmed);
  if (!modResult.safe) return { error: modResult.reason };

  // Check if already checked in today
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("student_id", user.id)
    .gte("created_at", `${today}T00:00:00Z`)
    .lt("created_at", `${today}T23:59:59.999Z`)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "You already checked in today!" };
  }

  // Insert check-in
  const { data: checkin, error: insertErr } = await supabase
    .from("daily_checkins")
    .insert({
      student_id: user.id,
      prompt,
      response: trimmed,
    })
    .select("id")
    .single();

  if (insertErr || !checkin) {
    console.error("Failed to insert check-in:", insertErr);
    return { error: "Something went wrong. Try again." };
  }

  // Check for low-quality streak (2+ consecutive under 20 chars) and flag teacher
  if (trimmed.length < 20) {
    try {
      const { data: recentCheckins } = await supabase
        .from("daily_checkins")
        .select("response")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2);

      const consecutiveLow = (recentCheckins ?? []).every(
        (c) => (c.response as string).length < 20
      );

      if (consecutiveLow && (recentCheckins ?? []).length >= 2) {
        const { createAlert } = await import("@/lib/teacher-alerts");
        await createAlert({
          supabase,
          studentId: user.id,
          alertType: "stuck",
          severity: "info",
          message: "Student has submitted 2+ low-effort daily check-ins in a row.",
          context: {
            type: "checkin_quality",
            recent_responses: (recentCheckins ?? []).map((c) => c.response),
          },
        });
      }
    } catch {
      // Non-blocking, don't fail the check-in
    }
  }

  // Fetch org_id for usage logging
  const { data: checkinProfile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  const checkinOrgId = checkinProfile?.org_id ?? null;

  // Get AI reply
  try {
    const aiResult = await sendMessageAuto({
      model: getModel("checkin_reply"),
      maxTokens: 800,
      systemPrompt:
        "You are a warm, encouraging AI co-founder. A student just shared a daily reflection about their business. Respond in 1-2 sentences. Be specific to what they said. No generic encouragement.",
      messages: [
        {
          role: "user",
          content: `Prompt: "${prompt}"\n\nMy response: "${trimmed}"`,
        },
      ],
    });

    // Update with AI reply
    await supabase
      .from("daily_checkins")
      .update({ ai_reply: aiResult.text })
      .eq("id", checkin.id);

    // Log AI usage
    try {
      await supabase.from("ai_usage_log").insert({
        student_id: user.id,
        org_id: checkinOrgId,
        feature: "checkin",
        model: aiResult.model_used,
        input_tokens: aiResult.usage.input_tokens,
        output_tokens: aiResult.usage.output_tokens,
        estimated_cost_usd:
          (aiResult.usage.input_tokens * 0.25 +
            aiResult.usage.output_tokens * 1.25) /
          1_000_000,
      });
    } catch (e) {
      console.error("Failed to log ai_usage for checkin:", e);
    }

    return { aiReply: aiResult.text };
  } catch (e) {
    console.error("AI reply failed for check-in:", e);
    return { aiReply: null };
  }
}

export async function getTodayCheckIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("student_id", user.id)
    .gte("created_at", `${today}T00:00:00Z`)
    .lt("created_at", `${today}T23:59:59.999Z`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getRecentCheckIns(studentId: string, limit = 3) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Students can only read their own check-ins
  if (user.id !== studentId) {
    // Check if caller is an instructor/admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
      return [];
    }
  }

  const { data } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
