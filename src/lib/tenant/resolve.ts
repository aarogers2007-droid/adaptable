/**
 * Edge-compatible tenant resolution with in-memory cache.
 * Uses createClient from @supabase/supabase-js directly (NOT @supabase/ssr)
 * because middleware runs on the Edge and doesn't have cookies().
 *
 * Service role key is safe here: middleware is server-only, never in client bundles.
 */
import { createClient } from "@supabase/supabase-js";
import { type TenantInfo, DEFAULT_ORG_ID, DEFAULT_SLUG } from "./types";

interface CacheEntry {
  tenant: TenantInfo;
  expiresAt: number;
}

const tenantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

const DEFAULT_TENANT: TenantInfo = {
  id: DEFAULT_ORG_ID,
  slug: DEFAULT_SLUG,
  ragNamespace: null,
};

/**
 * Resolve a hostname to a tenant. Returns default Adaptable org if no match.
 * Caches results (including misses) for 60 seconds.
 */
export async function resolveTenant(hostname: string): Promise<TenantInfo> {
  const parts = hostname.split(".");
  // Only treat as subdomain if hostname has 3+ parts (e.g., venturelab.adaptable.one)
  const subdomain = parts.length >= 3 ? parts[0] : null;

  if (!subdomain || subdomain === "www" || subdomain === "adaptable" || subdomain === "adaptable-one") {
    return DEFAULT_TENANT;
  }

  // Check cache
  const cached = tenantCache.get(subdomain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  // Query with service role (Edge-safe, no cookies needed)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("organizations")
      .select("id, slug, rag_namespace")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single();

    const tenant: TenantInfo = data
      ? { id: data.id, slug: data.slug, ragNamespace: data.rag_namespace }
      : DEFAULT_TENANT;

    // Cache result (including defaults for unknown subdomains)
    tenantCache.set(subdomain, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });

    // Lazy eviction when cache grows too large
    if (tenantCache.size > 100) {
      const now = Date.now();
      for (const [key, entry] of tenantCache) {
        if (entry.expiresAt < now) tenantCache.delete(key);
      }
    }

    return tenant;
  } catch {
    // DB failure: fall back to default, don't cache the failure
    return DEFAULT_TENANT;
  }
}
