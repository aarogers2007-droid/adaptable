import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadInventionDashboard } from "./actions";
import InventionDashboard from "./InventionDashboard";

export const dynamic = "force-dynamic";

export default async function InventionAdminPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await loadInventionDashboard(classId);

  if (data.error || !data.classCode) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--error)]">{data.error ?? "Failed to load"}</p>
      </main>
    );
  }

  return <InventionDashboard classId={classId} initialData={data as any} />;
}
