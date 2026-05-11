import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Print-ready archetype card — 4x6 inch postcard format.
 * Opens in a new tab, auto-triggers print dialog.
 * Student saves as PDF from the browser print dialog.
 */
export default async function CardPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; filename?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) redirect("/invention");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessionData } = await supabase
    .from("invention_sessions")
    .select("generated_card, student_id")
    .eq("id", sessionId)
    .single();

  if (!sessionData?.generated_card) redirect("/invention");

  // Auth: must be the student, an instructor of the class, or platform owner
  if (sessionData.student_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_owner, role")
      .eq("id", user.id)
      .single();
    if (!profile?.is_platform_owner && profile?.role !== "instructor") {
      redirect("/invention");
    }
  }

  const raw = sessionData.generated_card as Record<string, unknown>;
  const insightsRaw = raw.insights as Record<string, string> | undefined;

  // Backward compat: old cards have `description`, new cards have `portrait`
  const portrait = (raw.portrait as string) ?? (raw.description as string) ?? "";
  const edge = (raw.edge as string) ?? "";
  const watchOut = (raw.watch_out as string) ?? "";
  const title = (raw.title as string) ?? "";

  const titleWord = title.replace(/^The\s+/i, "");
  const hasNewSections = !!edge;

  const insights = [
    { label: "THE WISH", text: insightsRaw?.wish ?? "" },
    { label: "THE MIND", text: insightsRaw?.mind ?? "" },
    { label: "THE LENS", text: insightsRaw?.lens ?? "" },
    { label: "THE SCALE", text: insightsRaw?.scale ?? "" },
    { label: "THE VOICE", text: insightsRaw?.voice ?? "" },
  ];

  return (
    <html>
      <head>
        <title>{title}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700&family=DM+Sans:wght@400;500&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }

          @page {
            size: 4in 6in;
            margin: 0;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }

          body {
            width: 4in;
            height: 6in;
            background: #FAFAF8;
            font-family: 'DM Sans', sans-serif;
            display: flex;
            flex-direction: column;
            padding: 0.35in 0.3in;
            position: relative;
          }

          .the-label {
            font-size: 7px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.2em;
          }

          .title {
            font-family: 'EB Garamond', serif;
            font-size: 24px;
            font-weight: 700;
            color: #111;
            margin-top: 2px;
          }

          .portrait {
            font-size: ${hasNewSections ? "9px" : "11px"};
            font-weight: 500;
            color: #444;
            line-height: 1.5;
            margin-top: 8px;
          }

          .section-label {
            font-size: 6px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            margin-top: 8px;
            margin-bottom: 2px;
          }

          .section-text {
            font-size: 8.5px;
            color: #222;
            line-height: 1.4;
          }

          .section-text-italic {
            font-size: 8.5px;
            color: #555;
            line-height: 1.4;
            font-style: italic;
          }

          .divider {
            height: 1px;
            background: #E5E5E5;
            margin: 10px 0;
          }

          .insight-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 5px;
          }

          .insight-label {
            font-size: 6px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            width: 50px;
            flex-shrink: 0;
            padding-top: 1px;
          }

          .insight-text {
            font-size: 8px;
            color: #222;
            line-height: 1.4;
          }

          .footer {
            position: absolute;
            bottom: 0.15in;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 6px;
            color: #CCC;
          }
        `}</style>
      </head>
      <body>
        <p className="the-label">THE</p>
        <h1 className="title">{titleWord}</h1>
        <p className="portrait">{portrait}</p>

        {hasNewSections && edge && (
          <>
            <p className="section-label">THE EDGE</p>
            <p className="section-text">{edge}</p>
          </>
        )}

        {hasNewSections && watchOut && (
          <>
            <p className="section-label">WATCH OUT</p>
            <p className="section-text-italic">{watchOut}</p>
          </>
        )}

        <div className="divider" />
        {insights.map((ins) => (
          <div key={ins.label} className="insight-row">
            <span className="insight-label">{ins.label}</span>
            <span className="insight-text">{ins.text}</span>
          </div>
        ))}
        <p className="footer">adaptable.one</p>
        <script dangerouslySetInnerHTML={{ __html: "window.onload = () => window.print();" }} />
      </body>
    </html>
  );
}
