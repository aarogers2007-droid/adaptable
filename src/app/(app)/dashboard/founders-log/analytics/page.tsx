import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMirrorAnalytics } from "../analytics";

export const metadata = {
  title: "Mirror Analytics | Adaptable",
};

function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}m ${remainSec}s`;
}

export default async function MirrorAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Admin-only gate
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "org_admin") {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-12">
        <p className="text-[#9CA3AF]">Admin access required.</p>
      </main>
    );
  }

  const data = await getMirrorAnalytics();

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold text-[#111827] tracking-[-0.02em]">
        Mirror Analytics
      </h1>
      <p className="text-[14px] text-[#9CA3AF] mt-1">
        Aggregate data only. No student content is shown.
      </p>

      {/* Top-level metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        <MetricCard label="Total Reflections" value={data.totalEntries} />
        <MetricCard label="Response Rate" value={`${data.responseRate}%`} />
        <MetricCard label="Unique Students" value={data.uniqueStudents} />
        <MetricCard label="3+ Reflections" value={data.studentsWithMultiple} sub="students" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <MetricCard label="Avg Length" value={`${data.avgResponseLength}`} sub="chars" />
        <MetricCard label="Median Time" value={formatMs(data.medianTimeToRespondMs)} />
        <MetricCard label="Responded" value={data.totalResponded} />
        <MetricCard label="Skipped" value={data.totalSkipped} />
      </div>

      {/* By trigger type */}
      <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[#111827] mt-10 mb-4">
        By Trigger Type
      </h2>
      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-[#4B5563]">Trigger</th>
              <th className="text-right px-4 py-2.5 font-medium text-[#4B5563]">Count</th>
              <th className="text-right px-4 py-2.5 font-medium text-[#4B5563]">Responded</th>
              <th className="text-right px-4 py-2.5 font-medium text-[#4B5563]">Skip Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.byTriggerType.map((row) => (
              <tr key={row.trigger_type} className="border-t border-[#E5E7EB]">
                <td className="px-4 py-2.5 text-[#111827]">{row.trigger_type.replace(/_/g, " ")}</td>
                <td className="px-4 py-2.5 text-right text-[#4B5563]">{row.count}</td>
                <td className="px-4 py-2.5 text-right text-[#4B5563]">{row.responded}</td>
                <td className="px-4 py-2.5 text-right text-[#4B5563]">{row.skip_rate}%</td>
              </tr>
            ))}
            {data.byTriggerType.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-[#9CA3AF]">No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* By emotion */}
      <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[#111827] mt-10 mb-4">
        By Emotional State
      </h2>
      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-[#4B5563]">Emotion</th>
              <th className="text-right px-4 py-2.5 font-medium text-[#4B5563]">Count</th>
              <th className="text-right px-4 py-2.5 font-medium text-[#4B5563]">Responded</th>
            </tr>
          </thead>
          <tbody>
            {data.byEmotion.map((row) => (
              <tr key={row.emotional_snapshot} className="border-t border-[#E5E7EB]">
                <td className="px-4 py-2.5 text-[#111827] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{
                    background: {
                      engaged: "#0D9488", frustrated: "#F59E0B", anxious: "#FBBF24",
                      deflated: "#9CA3AF", manic: "#3B82F6", flat: "#E5E7EB",
                    }[row.emotional_snapshot] ?? "#E5E7EB"
                  }} />
                  {row.emotional_snapshot}
                </td>
                <td className="px-4 py-2.5 text-right text-[#4B5563]">{row.count}</td>
                <td className="px-4 py-2.5 text-right text-[#4B5563]">{row.responded}</td>
              </tr>
            ))}
            {data.byEmotion.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-4 text-center text-[#9CA3AF]">No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Daily activity */}
      {data.dailyActivity.length > 0 && (
        <>
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[#111827] mt-10 mb-4">
            Daily Activity (last 30 days)
          </h2>
          <div className="flex items-end gap-[3px] h-[80px]">
            {data.dailyActivity.map((day) => {
              const maxEntries = Math.max(...data.dailyActivity.map((d) => d.entries), 1);
              const height = Math.max((day.entries / maxEntries) * 100, 4);
              const respondedPct = day.entries > 0 ? day.responded / day.entries : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${height}%`,
                    background: respondedPct >= 0.5 ? "#0D9488" : "#E5E7EB",
                    opacity: respondedPct >= 0.5 ? 0.4 + respondedPct * 0.6 : 0.5,
                  }}
                  title={`${day.date}: ${day.entries} entries, ${day.responded} responded`}
                />
              );
            })}
          </div>
          <p className="text-[12px] text-[#9CA3AF] mt-2">
            Teal = 50%+ response rate. Gray = mostly skipped. Hover for details.
          </p>
        </>
      )}
    </main>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <p className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-[24px] font-semibold text-[#111827] mt-1 font-[family-name:var(--font-display)]">
        {value}
        {sub && <span className="text-[14px] font-normal text-[#9CA3AF] ml-1">{sub}</span>}
      </p>
    </div>
  );
}
