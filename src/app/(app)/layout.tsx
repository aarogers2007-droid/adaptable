import { getTenant } from "@/lib/tenant/get-tenant";
import { verifyTenantAccess } from "@/lib/tenant/verify-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();
  const access = await verifyTenantAccess(tenant.id);
  if (!access.authorized) {
    redirect("/login");
  }

  return <>{children}</>;
}
