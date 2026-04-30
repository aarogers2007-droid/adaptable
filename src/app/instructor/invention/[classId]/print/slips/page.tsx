import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Print-ready Student Slips — cut-sheet for handing out at the door.
 * 4 slips per row, alphabetically by last name, auto-triggers print dialog.
 * Black and white only, dashed cut lines.
 */
export default async function PrintSlipsPage({
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

  // Build flat list of students with group numbers
  const allStudentIds = (groups ?? []).flatMap((g) => g.student_ids);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", allStudentIds.length > 0 ? allStudentIds : ["__none__"]);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.full_name ?? "Unknown";
  }

  // Build student slips: { name, groupNumber }
  const slips: { name: string; groupNumber: number }[] = [];
  for (const group of groups ?? []) {
    for (const sid of group.student_ids) {
      slips.push({
        name: nameMap[sid] ?? sid.slice(0, 8),
        groupNumber: group.group_number,
      });
    }
  }

  // Sort alphabetically by last name (last word in full_name)
  slips.sort((a, b) => {
    const aLast = a.name.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
    const bLast = b.name.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
    if (aLast !== bLast) return aLast.localeCompare(bLast);
    return a.name.localeCompare(b.name);
  });

  return (
    <html lang="en">
      <head>
        <title>Student Slips — VentureLab Invention Mode</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @media print {
            @page { margin: 0.25in; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
          }
          .slip {
            border: 2px dashed #999;
            padding: 20px 16px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
            min-height: 160px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .slip-name {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
          }
          .slip-group {
            font-size: 72px;
            font-weight: 800;
            line-height: 1.1;
            margin-top: 8px;
          }
          .slip-label {
            font-size: 9px;
            color: #666;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .slip-event {
            font-size: 10px;
            color: #999;
            margin-top: 8px;
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      </head>
      <body>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {slips.map((slip, i) => (
            <div
              key={i}
              style={{
                border: "2px dashed #999",
                padding: "20px 16px",
                textAlign: "center",
                pageBreakInside: "avoid",
                breakInside: "avoid" as React.CSSProperties["breakInside"],
                minHeight: "160px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2 }}>
                {slip.name}
              </div>
              <div style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1.1, marginTop: "8px" }}>
                {slip.groupNumber}
              </div>
              <div style={{ fontSize: "9px", color: "#666", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Group
              </div>
              <div style={{ fontSize: "10px", color: "#999", marginTop: "8px" }}>
                VentureLab Invention Mode &middot; May 13, 2026
              </div>
            </div>
          ))}
        </div>
      </body>
    </html>
  );
}
