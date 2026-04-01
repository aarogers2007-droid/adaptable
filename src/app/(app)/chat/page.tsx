import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import ChatInterface from "./ChatInterface";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("business_idea, full_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Pick<Profile, "business_idea" | "full_name"> | null;
  if (!profile?.business_idea) redirect("/onboarding");

  // Get most recent conversation
  const { data: convoData } = await supabase
    .from("ai_conversations")
    .select("id, messages")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <ChatInterface
      businessName={profile.business_idea.name}
      studentName={profile.full_name ?? ""}
      initialConversationId={convoData?.id ?? null}
      initialMessages={(convoData?.messages as { role: "user" | "assistant"; content: string }[]) ?? []}
    />
  );
}
