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

  const hashed = await hashPin(pin);

  const { error } = await supabase
    .from("profiles")
    .update({ parent_access_pin: hashed })
    .eq("id", user.id);

  if (error) return { error: "Failed to set PIN" };
  return { success: true };
}
