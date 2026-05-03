import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const GROUP_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

/**
 * Print-ready all-cards page — one card per 4×6 inch page.
 * Auto-triggers print dialog. Ordered by last name.
 */
export default async function PrintAllCardsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Auth check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_platform_owner")
    .eq("id", user.id)
    .single();

  const { data: cls } = await supabase
    .from("classes")
    .select("instructor_id, session_type, grouping_config")
    .eq("id", classId)
    .single();

  if (!cls || cls.session_type !== "invention") redirect("/login");

  const isPlatformOwner = (profile as Record<string, unknown>)?.is_platform_owner === true;
  const isInstructor = cls.instructor_id === user.id;
  const coAdmins = ((cls.grouping_config as Record<string, unknown>)?.co_admin_ids as string[]) ?? [];
  const isCoAdmin = coAdmins.includes(user.id);

  if (!isPlatformOwner && !isInstructor && profile?.role !== "org_admin" && !isCoAdmin) {
    redirect("/login");
  }

  // Get invite code
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) redirect("/login");

  // Get all sessions with cards
  const { data: sessions } = await supabase
    .from("invention_sessions")
    .select("student_id, generated_card, group_number")
    .eq("class_code", inviteCode.code)
    .not("generated_card", "is", null);

  if (!sessions || sessions.length === 0) {
    return <html><body><p>No cards generated yet.</p></body></html>;
  }

  // Get student names
  const studentIds = sessions.map((s) => s.student_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", studentIds);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.full_name ?? "Unknown";
  }

  // Sort by last name
  const sorted = sessions.sort((a, b) => {
    const aLast = (nameMap[a.student_id] ?? "").split(" ").pop() ?? "";
    const bLast = (nameMap[b.student_id] ?? "").split(" ").pop() ?? "";
    return aLast.localeCompare(bLast);
  });

  const insights = ["wish", "mind", "lens", "scale", "voice"] as const;
  const insightLabels = { wish: "THE WISH", mind: "THE MIND", lens: "THE LENS", scale: "THE SCALE", voice: "THE VOICE" };

  return (
    <html>
      <head>
        <title>{inviteCode.code} — All Cards</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700&family=DM+Sans:wght@400;500&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: 4in 6in; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          body { font-family: 'DM Sans', sans-serif; }
          .card-page {
            width: 4in; height: 6in; padding: 0.35in;
            background: #FAFAF8; position: relative;
            page-break-after: always; break-after: page;
          }
          .card-page:last-child { page-break-after: auto; break-after: auto; }
          .the-label { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 0.2em; }
          .title { font-family: 'EB Garamond', serif; font-size: 28px; font-weight: 700; color: #111; margin-top: 2px; }
          .desc { font-size: 11px; font-weight: 500; color: #444; line-height: 1.6; margin-top: 10px; }
          .divider { height: 1px; background: #E5E5E5; margin: 14px 0; }
          .insight-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
          .insight-label { font-size: 7px; color: #999; text-transform: uppercase; letter-spacing: 0.12em; width: 60px; flex-shrink: 0; padding-top: 2px; }
          .insight-text { font-size: 10px; color: #222; line-height: 1.5; }
          .footer { position: absolute; bottom: 0.2in; left: 0; right: 0; text-align: center; font-size: 7px; color: #CCC; }
          .group-border { border-left: 3px solid; padding-left: 0.15in; }
          .student-name { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        `}</style>
      </head>
      <body>
        {sorted.map((session, idx) => {
          const card = session.generated_card as {
            title: string;
            description: string;
            insights: Record<string, string>;
          };
          const titleWord = card.title.replace(/^The\s+/i, "");
          const groupColor = session.group_number
            ? GROUP_COLORS[(session.group_number - 1) % GROUP_COLORS.length]
            : undefined;
          const firstName = (nameMap[session.student_id] ?? "").split(" ")[0];

          return (
            <div
              key={idx}
              className={`card-page ${groupColor ? "group-border" : ""}`}
              style={groupColor ? { borderLeftColor: groupColor } : undefined}
            >
              <p className="student-name">{firstName}</p>
              <p className="the-label">THE</p>
              <h1 className="title">{titleWord}</h1>
              <p className="desc">{card.description}</p>
              <div className="divider" />
              {insights.map((key) => (
                <div key={key} className="insight-row">
                  <span className="insight-label">{insightLabels[key]}</span>
                  <span className="insight-text">{card.insights[key]}</span>
                </div>
              ))}
              <p className="footer">adaptable.one</p>
            </div>
          );
        })}
        <script dangerouslySetInnerHTML={{ __html: "window.onload = () => window.print();" }} />
      </body>
    </html>
  );
}
