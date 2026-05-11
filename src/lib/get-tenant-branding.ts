import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type BrandingConfig, DEFAULT_BRANDING, mergeBranding } from "./branding";

/**
 * Fetch branding config for the current tenant based on hostname.
 * Server-side only. Returns DEFAULT_BRANDING if no match.
 */
export async function getTenantBranding(hostname: string | null): Promise<BrandingConfig> {
  if (!hostname) return DEFAULT_BRANDING;

  // Extract subdomain: "venturelab.adaptable.one" → "venturelab"
  const parts = hostname.split(".");
  const subdomain = parts.length >= 3 ? parts[0] : null;

  if (!subdomain || subdomain === "www" || subdomain === "adaptable") {
    return DEFAULT_BRANDING;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("organizations")
      .select("branding_config, name")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single();

    if (!data) return DEFAULT_BRANDING;

    const config = (data.branding_config as Partial<BrandingConfig>) ?? {};
    // Use org name as platform_name fallback if branding_config doesn't specify one
    if (!config.platform_name) config.platform_name = data.name;

    return mergeBranding(config);
  } catch {
    // DB failure — fall back to default branding, never block the page
    return DEFAULT_BRANDING;
  }
}

/**
 * Fetch branding config by org ID. Used by the root layout when
 * middleware has already resolved the tenant and injected x-tenant-id.
 * Avoids a redundant subdomain lookup.
 */
export async function getTenantBrandingById(orgId: string | null): Promise<BrandingConfig> {
  if (!orgId || orgId === "00000000-0000-0000-0000-000000000001") {
    return DEFAULT_BRANDING;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("organizations")
      .select("branding_config, name")
      .eq("id", orgId)
      .eq("is_active", true)
      .single();

    if (!data) return DEFAULT_BRANDING;

    const config = (data.branding_config as Partial<BrandingConfig>) ?? {};
    if (!config.platform_name) config.platform_name = data.name;

    return mergeBranding(config);
  } catch {
    return DEFAULT_BRANDING;
  }
}

/**
 * Fetch platform_name for a user's org. Used in server-side API routes
 * where hostname isn't available but user's org_id is.
 */
export async function getOrgBrandName(orgId: string | null): Promise<string> {
  if (!orgId) return DEFAULT_BRANDING.platform_name;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("organizations")
      .select("branding_config, name")
      .eq("id", orgId)
      .single();

    if (!data) return DEFAULT_BRANDING.platform_name;

    const config = data.branding_config as Record<string, string> | null;
    return config?.platform_name || data.name || DEFAULT_BRANDING.platform_name;
  } catch {
    return DEFAULT_BRANDING.platform_name;
  }
}
