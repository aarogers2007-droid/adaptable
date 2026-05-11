"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

// ─── Reserved subdomains ───
const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "adaptable", "mail", "ftp",
  "staging", "demo", "test", "dev", "beta", "status", "help",
  "support", "docs", "blog", "cdn", "assets", "static",
]);

// ─── Subdomain format: a-z start, a-z0-9- middle, a-z0-9 end, 3-32 chars ───
const SUBDOMAIN_REGEX = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

/**
 * Generates a slug from an org name.
 * e.g. "Riverside Academy" → "riverside-academy"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

// ─── Action 1: Get profile context for prefilling ───

export async function getOnboardingContext(): Promise<{
  contactName: string;
  contactEmail: string;
  alreadyHasOrg: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { contactName: "", contactEmail: "", alreadyHasOrg: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, org_id")
    .eq("id", user.id)
    .single();

  return {
    contactName: profile?.full_name ?? "",
    contactEmail: profile?.email ?? user.email ?? "",
    alreadyHasOrg: !!profile?.org_id,
  };
}

// ─── Action 2: Debounced subdomain availability check ───

export async function checkSubdomainAvailability(subdomain: string): Promise<{
  available: boolean;
  error?: string;
}> {
  const normalized = subdomain.toLowerCase().trim();

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return { available: false, error: "Must be 3-32 characters, lowercase letters, numbers, and hyphens." };
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

// ─── Action 3: Provision organization (main action) ───

export async function provisionOrganization(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
  goToStep?: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Extract form fields
  const orgName = (formData.get("orgName") as string)?.trim();
  const subdomain = (formData.get("subdomain") as string)?.toLowerCase().trim();
  const contactName = (formData.get("contactName") as string)?.trim();
  const contactEmail = (formData.get("contactEmail") as string)?.trim();
  const primaryColor = (formData.get("primaryColor") as string) || "#0D9488";
  const secondaryColor = (formData.get("secondaryColor") as string) || "#C084FC";
  const welcomeMessage = (formData.get("welcomeMessage") as string)?.trim() || "";
  const logoFile = formData.get("logo") as File | null;
  const faviconFile = formData.get("favicon") as File | null;

  // Validate required fields
  if (!orgName || !subdomain) {
    return { error: "Organization name and subdomain are required." };
  }

  // Validate subdomain format
  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    return { error: "Invalid subdomain format.", goToStep: 1 };
  }

  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return { error: "This subdomain is reserved.", goToStep: 1 };
  }

  const admin = createAdminClient();
  const slug = toSlug(orgName);

  // Step 1: Create org row (branding_config without URLs for now)
  const brandingConfig = {
    platform_name: orgName,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    welcome_message: welcomeMessage,
    support_email: contactEmail || "",
    logo_url: "",
    favicon_url: "",
    domain: `${subdomain}.adaptable.one`,
  };

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      subdomain,
      branding_config: brandingConfig,
      subscription_tier: "starter",
      is_active: true,
    })
    .select("id")
    .single();

  if (orgError) {
    // Unique constraint violation on subdomain or slug
    if (orgError.code === "23505") {
      return {
        error: "This subdomain was just claimed by another organization. Please choose a different one.",
        goToStep: 1,
      };
    }
    console.error("[org-onboarding] org creation failed:", orgError);
    return { error: "Failed to create organization. Please try again." };
  }

  const orgId = org.id;

  // Step 2: Upload logo and favicon if provided
  let logoUrl = "";
  let faviconUrl = "";

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.type === "image/svg+xml" ? "svg" : "png";
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
      console.error("[org-onboarding] logo upload failed:", uploadError);
      // Non-fatal: org exists, logo can be uploaded later
    }
  }

  if (faviconFile && faviconFile.size > 0) {
    const ext = faviconFile.type === "image/svg+xml" ? "svg" : "png";
    const { error: uploadError } = await supabase.storage
      .from("branding-assets")
      .upload(`${orgId}/favicon.${ext}`, faviconFile, {
        contentType: faviconFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("branding-assets")
        .getPublicUrl(`${orgId}/favicon.${ext}`);
      faviconUrl = urlData.publicUrl;
    } else {
      console.error("[org-onboarding] favicon upload failed:", uploadError);
    }
  }

  // Step 3: Update branding_config with URLs if we got them
  if (logoUrl || faviconUrl) {
    const updatedConfig = {
      ...brandingConfig,
      ...(logoUrl && { logo_url: logoUrl }),
      ...(faviconUrl && { favicon_url: faviconUrl }),
    };
    await admin
      .from("organizations")
      .update({ branding_config: updatedConfig })
      .eq("id", orgId);
  }

  // Step 4: Update the user's profile
  await admin
    .from("profiles")
    .update({
      org_id: orgId,
      role: "org_admin",
      full_name: contactName || undefined,
    })
    .eq("id", user.id);

  // Step 5: Create default welcome class + invite code
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

  if (cls) {
    const code = orgName
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "WELCOME";

    await admin.from("invite_codes").insert({
      code: `${code}1`,
      class_id: cls.id,
      created_by: user.id,
      max_uses: 200,
      current_uses: 0,
    });
  }

  redirect("/instructor/dashboard");
}
