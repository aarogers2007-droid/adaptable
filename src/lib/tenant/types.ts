export interface TenantInfo {
  id: string;
  slug: string;
  ragNamespace: string | null;
}

/** Default Adaptable org — used when no subdomain matches */
export const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
export const DEFAULT_SLUG = "adaptable";
