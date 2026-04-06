"use server";

import { createClient } from "@/lib/supabase/server";

export interface CardConfig {
  finish: string;
  accentColor: string | null;
  cardBase: string;
  backDesign: string;
  borderStyle: string;
  cardFont?: string;
}

export async function getCardConfig(studentId: string): Promise<CardConfig> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { finish: "matte", accentColor: null, cardBase: "black", backDesign: "achievements", borderStyle: "clean" };

  // Students can only read their own card config
  if (user.id !== studentId) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
      return { finish: "matte", accentColor: null, cardBase: "black", backDesign: "achievements", borderStyle: "clean" };
    }
  }

  const { data } = await supabase
    .from("student_card_config")
    .select("*")
    .eq("student_id", studentId)
    .single();

  if (!data) {
    return {
      finish: "matte",
      accentColor: null,
      cardBase: "black",
      backDesign: "achievements",
      borderStyle: "clean",
    };
  }

  return {
    finish: data.card_finish,
    accentColor: data.accent_color,
    cardBase: data.card_base ?? "black",
    backDesign: data.back_design,
    borderStyle: data.border_style,
  };
}

export async function saveCardConfig(config: CardConfig): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate finish value against allowed options
  const ALLOWED_FINISHES = ["matte", "holographic", "gold", "silver", "chrome"];
  const ALLOWED_BASES = ["black", "white", "grey", "navy", "forest", "wine", "gold"];
  const ALLOWED_BORDERS = ["clean", "rounded", "beveled"];

  if (config.finish && !ALLOWED_FINISHES.includes(config.finish)) {
    return { success: false, error: "Invalid finish" };
  }
  if (config.cardBase && !ALLOWED_BASES.includes(config.cardBase)) {
    return { success: false, error: "Invalid card base" };
  }
  if (config.borderStyle && !ALLOWED_BORDERS.includes(config.borderStyle)) {
    return { success: false, error: "Invalid border style" };
  }

  const { error } = await supabase.from("student_card_config").upsert(
    {
      student_id: user.id,
      card_finish: config.finish,
      accent_color: config.accentColor,
      card_base: config.cardBase,
      back_design: config.backDesign,
      border_style: config.borderStyle,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
