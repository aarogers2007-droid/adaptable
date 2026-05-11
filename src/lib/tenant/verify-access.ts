import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Verify the authenticated user belongs to the current tenant org.
 * Platform owners (is_platform_owner=true) are exempt — they can access any tenant.
 *
 * Use in protected page.tsx files:
 *   const tenant = await getTenant();
 *   const access = await verifyTenantAccess(tenant.id);
 *   if (!access.authorized) redirect("/unauthorized");
 */
export async function verifyTenantAccess(tenantOrgId: string): Promise<{
  authorized: boolean;
  userId?: string;
  orgId?: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile) return { authorized: false };

  // Platform owners can access any tenant
  if ((profile as Record<string, unknown>).is_platform_owner) {
    return { authorized: true, userId: user.id, orgId: profile.org_id };
  }

  // Users without an org are authorized on the default tenant only
  if (!profile.org_id) {
    return { authorized: tenantOrgId === "00000000-0000-0000-0000-000000000001", userId: user.id, orgId: null };
  }

  // Regular users must belong to this org
  return {
    authorized: profile.org_id === tenantOrgId,
    userId: user.id,
    orgId: profile.org_id,
  };
}
