"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPin } from "@/lib/pin";

export async function setParentPin(pin: string) {
  if (!/^\d{6}$/.test(pin)) {
    return { error: "PIN must be exactly 6 digits" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if a PIN already exists — students can only SET, not CHANGE
  const { data: profile } = await supabase
    .from("profiles")
    .select("parent_access_pin")
    .eq("id", user.id)
    .single();

  if (profile?.parent_access_pin) {
    return { error: "A parent PIN has already been set. Contact your teacher to reset it." };
  }

  const hashed = await hashPin(pin);

  const { error } = await supabase
    .from("profiles")
    .update({ parent_access_pin: hashed })
    .eq("id", user.id);

  if (error) return { error: "Failed to set PIN" };
  return { success: true };
}
