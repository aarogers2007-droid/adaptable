"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

// ─── Onboarding step enum ───

export const ONBOARDING_STEP = {
  ACCOUNT_CREATED: 1,
  ORG_NAMED: 2,
  BRANDED: 3,
  PAID: 4,
  COMPLETE: 5,
} as const;

// ─── Reserved subdomains ───

const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "adaptable", "mail", "ftp",
  "staging", "demo", "test", "dev", "beta", "status", "help",
  "support", "docs", "blog", "cdn", "assets", "static",
]);

const SUBDOMAIN_REGEX = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

// ─── Helpers ───

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

// ─── Action 1: Get onboarding context for wizard resume ───

export async function getOnboardingContext(): Promise<{
  user: { id: string; email: string; fullName: string } | null;
  org: { id: string; name: string; subdomain: string; brandingConfig: Record<string, unknown> } | null;
  onboardingStep: number;
  inviteCode: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, org: null, onboardingStep: 0, inviteCode: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, full_name, onboarding_step")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      user: { id: user.id, email: user.email ?? "", fullName: "" },
      org: null,
      onboardingStep: ONBOARDING_STEP.ACCOUNT_CREATED,
      inviteCode: null,
    };
  }

  let org: { id: string; name: string; subdomain: string; brandingConfig: Record<string, unknown> } | null = null;
  let inviteCode: string | null = null;

  if (profile.org_id) {
    const admin = createAdminClient();

    const { data: orgData } = await admin
      .from("organizations")
      .select("id, name, subdomain, branding_config")
      .eq("id", profile.org_id)
      .single();

    if (orgData) {
      org = {
        id: orgData.id,
        name: orgData.name,
        subdomain: orgData.subdomain,
        brandingConfig: (orgData.branding_config as Record<string, unknown>) ?? {},
      };
    }

    // Find invite code via classes
    const { data: classData } = await admin
      .from("classes")
      .select("id")
      .eq("org_id", profile.org_id)
      .limit(1)
      .single();

    if (classData) {
      const { data: codeData } = await admin
        .from("invite_codes")
        .select("code")
        .eq("class_id", classData.id)
        .limit(1)
        .single();

      inviteCode = codeData?.code ?? null;
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile.full_name ?? "",
    },
    org,
    onboardingStep: profile.onboarding_step ?? ONBOARDING_STEP.ACCOUNT_CREATED,
    inviteCode,
  };
}

// ─── Action 2: Create organization stub ───

export async function createOrgStub(
  orgName: string,
  subdomain: string
): Promise<
  | { success: true; orgId: string; inviteCode: string }
  | { error: string; goToStep?: number }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Guard: idempotent — if user already has an org at step >= 2, return it
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, onboarding_step")
    .eq("id", user.id)
    .single();

  if (profile?.org_id && (profile.onboarding_step ?? 0) >= ONBOARDING_STEP.ORG_NAMED) {
    // Return existing org info
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("id", profile.org_id)
      .single();

    if (existingOrg) {
      // Find existing invite code
      const { data: cls } = await admin
        .from("classes")
        .select("id")
        .eq("org_id", existingOrg.id)
        .limit(1)
        .single();

      let existingCode = "";
      if (cls) {
        const { data: codeRow } = await admin
          .from("invite_codes")
          .select("code")
          .eq("class_id", cls.id)
          .limit(1)
          .single();
        existingCode = codeRow?.code ?? "";
      }

      return { success: true, orgId: existingOrg.id, inviteCode: existingCode };
    }
  }

  // Validate org name
  const trimmedName = orgName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return { error: "Organization name must be 2-100 characters." };
  }

  // Validate subdomain
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  if (!SUBDOMAIN_REGEX.test(normalizedSubdomain)) {
    return {
      error: "Subdomain must be 3-32 characters, lowercase letters, numbers, and hyphens.",
      goToStep: ONBOARDING_STEP.ACCOUNT_CREATED,
    };
  }
  if (RESERVED_SUBDOMAINS.has(normalizedSubdomain)) {
    return {
      error: "This subdomain is reserved.",
      goToStep: ONBOARDING_STEP.ACCOUNT_CREATED,
    };
  }

  const slug = toSlug(trimmedName);

  const brandingConfig = {
    platform_name: trimmedName,
    primary_color: "#0D9488",
    secondary_color: "#C084FC",
    logo_url: "",
    favicon_url: "",
    welcome_message: "",
    support_email: "",
    domain: `${normalizedSubdomain}.adaptable.one`,
  };

  // Create the organization
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: trimmedName,
      slug,
      subdomain: normalizedSubdomain,
      branding_config: brandingConfig,
      subscription_tier: "starter",
      is_active: false,
    })
    .select("id")
    .single();

  if (orgError) {
    if (orgError.code === "23505") {
      return {
        error: "This subdomain was just claimed by another organization. Please choose a different one.",
        goToStep: ONBOARDING_STEP.ACCOUNT_CREATED,
      };
    }
    console.error("[start/actions] org creation failed:", orgError);
    return { error: "Failed to create organization. Please try again." };
  }

  const orgId = org.id;

  // Update profile: assign org, set role, advance step
  await admin
    .from("profiles")
    .update({
      org_id: orgId,
      role: "org_admin",
      onboarding_step: ONBOARDING_STEP.ORG_NAMED,
    })
    .eq("id", user.id);

  // Create Welcome Class
  const { data: cls } = await admin
    .from("classes")
    .insert({
      org_id: orgId,
      instructor_id: user.id,
      name: "Welcome Class",
      session_type: "curriculum",
    })
    .select("id")
    .single();

  // Create invite code derived from org name
  let inviteCode = "";
  if (cls) {
    const baseCode = trimmedName
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "WELCOME";

    for (let i = 1; i <= 99; i++) {
      const code = `${baseCode}${i}`.slice(0, 8);
      const { error: codeError } = await admin.from("invite_codes").insert({
        code,
        class_id: cls.id,
        created_by: user.id,
        max_uses: 200,
        current_uses: 0,
      });
      if (!codeError) {
        inviteCode = code;
        break;
      }
    }
  }

  return { success: true, orgId, inviteCode };
}

// ─── Action 3: Check subdomain availability ───

export async function checkSubdomainAvailability(subdomain: string): Promise<{
  available: boolean;
  error?: string;
}> {
  const normalized = subdomain.toLowerCase().trim();

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      available: false,
      error: "Must be 3-32 characters, lowercase letters, numbers, and hyphens.",
    };
  }

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { available: false, error: "This subdomain is reserved." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("subdomain", normalized)
    .limit(1)
    .single();

  return { available: !data };
}

// ─── Action 4: Save branding ───

export async function saveBranding(
  orgId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const admin = createAdminClient();

  const logoFile = formData.get("logo") as File | null;
  const primaryColor = ((formData.get("primaryColor") as string) ?? "") || "#0D9488";
  const secondaryColor = ((formData.get("secondaryColor") as string) ?? "") || "#C084FC";

  // Get existing branding config to merge
  const { data: orgData } = await admin
    .from("organizations")
    .select("branding_config")
    .eq("id", orgId)
    .single();

  const existingConfig = (orgData?.branding_config as Record<string, unknown>) ?? {};
  let logoUrl = (existingConfig.logo_url as string) ?? "";

  // Upload logo if provided
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.type === "image/svg+xml" ? "svg"
      : logoFile.type === "image/jpeg" ? "jpg" : "png";
    const { error: uploadError } = await supabase.storage
      .from("branding-assets")
      .upload(`${orgId}/logo.${ext}`, logoFile, {
        contentType: logoFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("branding-assets")
        .getPublicUrl(`${orgId}/logo.${ext}`);
      logoUrl = urlData.publicUrl;
    } else {
      console.error("[start/actions] logo upload failed:", uploadError);
      // Non-fatal: branding can still be saved without logo
    }
  }

  const updatedConfig = {
    ...existingConfig,
    logo_url: logoUrl,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
  };

  await admin
    .from("organizations")
    .update({ branding_config: updatedConfig })
    .eq("id", orgId);

  // Advance onboarding step
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.BRANDED })
    .eq("id", user.id);

  return { success: true };
}

// ─── Action 5: Activate subscription after Stripe checkout ───

export async function activateSubscription(
  sessionId: string
): Promise<{ success: true; status: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Retrieve the Stripe Checkout Session
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch (err) {
    console.error("[start/actions] Stripe session retrieval failed:", err);
    return { error: "Could not verify payment session." };
  }

  // Verify the session belongs to this user (prevent session_id theft)
  if (session.metadata?.user_id !== user.id) {
    return { error: "This payment session does not belong to your account." };
  }

  // Verify payment
  const subscription = session.subscription as Stripe.Subscription | null;
  if (
    session.payment_status !== "paid" &&
    !(subscription && subscription.status === "trialing")
  ) {
    return { error: "Payment has not been completed." };
  }

  if (!subscription) {
    return { error: "No subscription found on this session." };
  }

  // Map price ID to plan tier (lazy lookup, safe if env vars missing)
  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const priceToTier: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID ?? ""]: "starter",
    [process.env.STRIPE_GROWTH_PRICE_ID ?? ""]: "growth",
    [process.env.STRIPE_SCALE_PRICE_ID ?? ""]: "scale",
  };
  const planTier = priceToTier[priceId] ?? "starter";

  // Get org_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return { error: "No organization found for this user." };
  }

  // Upsert subscription record
  // In the Dahlia API, current_period_start/end live on subscription items
  const firstItem = subscription.items.data[0];
  const subscriptionData = {
    org_id: profile.org_id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: (session.customer as string) ?? "",
    plan_tier: planTier,
    status: subscription.status,
    current_period_start: new Date(firstItem.current_period_start * 1000).toISOString(),
    current_period_end: new Date(firstItem.current_period_end * 1000).toISOString(),
  };

  await admin
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "stripe_subscription_id" });

  // Update org with Stripe customer ID and subscription tier
  await admin
    .from("organizations")
    .update({
      stripe_customer_id: session.customer as string,
      subscription_tier: planTier,
    })
    .eq("id", profile.org_id);

  // Advance onboarding step
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.PAID })
    .eq("id", user.id);

  return { success: true, status: subscription.status };
}

// ─── Action 6: Launch program (final step) ───

export async function launchProgram(
  orgId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const admin = createAdminClient();

  // Activate the organization
  await admin
    .from("organizations")
    .update({ is_active: true })
    .eq("id", orgId);

  // Advance onboarding step to complete
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.COMPLETE })
    .eq("id", user.id);

  return { success: true };
}
