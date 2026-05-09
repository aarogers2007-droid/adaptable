/**
 * Branding configuration for multi-tenant whitelabel support.
 * Every org gets its own brand identity injected at runtime.
 */

export interface BrandingConfig {
  platform_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  welcome_message: string;
  support_email: string;
  domain: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  platform_name: "Adaptable",
  logo_url: "",
  favicon_url: "",
  primary_color: "#0D9488",
  secondary_color: "#C084FC",
  welcome_message: "",
  support_email: "",
  domain: "adaptable.one",
};

/**
 * Merge a partial branding config with defaults.
 * Ensures no field is ever missing or empty string where a default exists.
 */
export function mergeBranding(partial: Partial<BrandingConfig>): BrandingConfig {
  const merged = { ...DEFAULT_BRANDING };
  for (const [key, value] of Object.entries(partial)) {
    if (value && typeof value === "string" && value.trim() !== "") {
      (merged as Record<string, string>)[key] = value;
    }
  }
  return merged;
}
