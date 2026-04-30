import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Print-ready Group Roster — wall-posting / facilitator reference sheet.
 * Grid of group blocks, 3-4 across, auto-triggers print dialog.
 * Black and white only, no design tokens.
 */
export default async function PrintRosterPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Auth check: instructor, org_admin, or co-admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: cls } = await supabase
    .from("classes")
    .select("instructor_id, org_id, session_type, grouping_config")
    .eq("id", classId)
    .single();

  if (!cls || cls.session_type !== "invention") redirect("/instructor/dashboard");

  const isInstructor = cls.instructor_id === user.id;
  const isOrgAdmin = profile?.role === "org_admin";
  const coAdminIds = (cls.grouping_config as Record<string, unknown> | null)?.co_admin_ids as string[] ?? [];
  const isCoAdmin = coAdminIds.includes(user.id);

  if (!isInstructor && !isOrgAdmin && !isCoAdmin) {
    return <main style={{ padding: "48px", fontFamily: "sans-serif" }}><p>Not authorized</p></main>;
  }

  // Load groups and student names
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) {
    return <main style={{ padding: "48px", fontFamily: "sans-serif" }}><p>No class code found</p></main>;
  }

  const { data: groups } = await supabase
    .from("invention_groups")
    .select("group_number, student_ids")
    .eq("class_code", inviteCode.code)
    .order("group_number");

  const allStudentIds = (groups ?? []).flatMap((g) => g.student_ids);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", allStudentIds.length > 0 ? allStudentIds : ["__none__"]);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.full_name ?? "Unknown";
  }

  const totalGroups = groups?.length ?? 0;

  return (
    <html lang="en">
      <head>
        <title>Group Roster — VentureLab Invention Mode</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @media print {
            @page { margin: 0.5in; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          .header {
            text-align: center;
            padding: 24px 0 32px;
            border-bottom: 2px solid #000;
            margin-bottom: 32px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .header p {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          @media (min-width: 900px) {
            .grid { grid-template-columns: repeat(4, 1fr); }
          }
          .group-block {
            border: 2px solid #000;
            padding: 16px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .group-number {
            text-align: center;
            font-size: 48px;
            font-weight: 800;
            line-height: 1.1;
            padding-bottom: 12px;
            border-bottom: 1px solid #ccc;
            margin-bottom: 12px;
          }
          .student-name {
            font-size: 16px;
            line-height: 2;
            padding-left: 4px;
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      </head>
      <body>
        <div className="header" style={{ textAlign: "center", padding: "24px 0 32px", borderBottom: "2px solid #000", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>VentureLab Invention Mode</h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
            May 13, 2026 &middot; {totalGroups} groups
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {(groups ?? []).map((group) => (
            <div key={group.group_number} style={{ border: "2px solid #000", padding: "16px", pageBreakInside: "avoid", breakInside: "avoid" as React.CSSProperties["breakInside"] }}>
              <div style={{ textAlign: "center", fontSize: "48px", fontWeight: 800, lineHeight: 1.1, paddingBottom: "12px", borderBottom: "1px solid #ccc", marginBottom: "12px" }}>
                {group.group_number}
              </div>
              {group.student_ids.map((sid: string) => (
                <div key={sid} style={{ fontSize: "16px", lineHeight: 2, paddingLeft: "4px" }}>
                  {nameMap[sid] ?? sid.slice(0, 8)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </body>
    </html>
  );
}
