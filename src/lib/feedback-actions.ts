"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Submit a "Tell AJ your thoughts" feedback message.
 * Captures the user's name + current page so AJ can read context.
 */
export async function submitFeedback(params: {
  message: string;
  rating?: number;
  page?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in to submit feedback." };

  const trimmed = params.message.trim();
  if (trimmed.length === 0) return { ok: false, error: "Message can't be empty." };
  if (trimmed.length > 5000) return { ok: false, error: "Message is too long (max 5000 characters)." };

  // Get the user's name for AJ-readable context
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  const userName = (profile?.full_name as string) || (profile?.email as string) || "Anonymous";

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    user_name: userName,
    page: params.page ?? null,
    message: trimmed,
    rating: params.rating ?? null,
    user_agent: params.userAgent?.slice(0, 500) ?? null,
  });

  if (error) {
    console.error("[feedback] insert failed:", error);
    return { ok: false, error: "Couldn't save feedback. Try again?" };
  }

  return { ok: true };
}
