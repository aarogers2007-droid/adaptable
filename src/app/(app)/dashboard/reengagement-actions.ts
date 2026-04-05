"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";

export async function generateReengagementTeaser(studentId: string) {
  const supabase = await createClient();

  // Auth check — only allow calling for your own student ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== studentId) {
    return { teaserMessage: null, ctaLink: "/dashboard" };
  }

  // Check last activity from ai_usage_log
  const { data: lastActivity } = await supabase
    .from("ai_usage_log")
    .select("created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastActivity?.created_at) return null;

  const lastActiveAt = new Date(lastActivity.created_at);
  const hoursInactive = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60);

  if (hoursInactive < 24) return null;

  // Get student profile for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_idea, full_name")
    .eq("id", studentId)
    .single();

  if (!profile?.business_idea) return null;

  const businessIdea = profile.business_idea as {
    name: string;
    niche: string;
  };

  // Get current lesson progress for CTA link
  const { data: currentProgress } = await supabase
    .from("student_progress")
    .select("lesson_id")
    .eq("student_id", studentId)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const ctaLink = currentProgress?.lesson_id
    ? `/lessons/${currentProgress.lesson_id}`
    : "/chat";

  // Generate teaser message using AI
  const teaserSystemPrompt = `Generate a 1-sentence teaser message from an AI co-founder to a student who hasn't engaged in a while. The student's business is "${businessIdea.name}" — ${businessIdea.niche}. Make it specific and curiosity-driven, like "I had an idea about your pricing" or "I think I know who your first customer should be". Never say "come back" or "we miss you". Sound like a friend with an idea, not a notification. Return ONLY the teaser sentence, nothing else.`;

  try {
    const { text } = await sendMessage({
      feature: "checkin",
      systemPrompt: teaserSystemPrompt,
      messages: [
        {
          role: "user",
          content: "Generate the teaser message.",
        },
      ],
    });

    return {
      teaserMessage: text.trim(),
      ctaLink,
    };
  } catch {
    return null;
  }
}
