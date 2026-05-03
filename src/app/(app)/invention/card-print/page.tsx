import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Print-ready archetype card — 4×6 inch postcard format.
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

  const card = sessionData.generated_card as {
    title: string;
    description: string;
    insights: { wish: string; mind: string; lens: string; scale: string; voice: string };
  };

  const titleWord = card.title.replace(/^The\s+/i, "");

  const insights = [
    { label: "THE WISH", text: card.insights.wish },
    { label: "THE MIND", text: card.insights.mind },
    { label: "THE LENS", text: card.insights.lens },
    { label: "THE SCALE", text: card.insights.scale },
    { label: "THE VOICE", text: card.insights.voice },
  ];

  return (
    <html>
      <head>
        <title>{card.title}</title>
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
            padding: 0.4in 0.35in;
            position: relative;
          }

          .the-label {
            font-size: 8px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-family: 'DM Sans', sans-serif;
          }

          .title {
            font-family: 'EB Garamond', serif;
            font-size: 28px;
            font-weight: 700;
            color: #111;
            margin-top: 2px;
          }

          .description {
            font-size: 11px;
            font-weight: 500;
            color: #444;
            line-height: 1.6;
            margin-top: 10px;
          }

          .divider {
            height: 1px;
            background: #E5E5E5;
            margin: 14px 0;
          }

          .insight-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 8px;
          }

          .insight-label {
            font-size: 7px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            width: 60px;
            flex-shrink: 0;
            padding-top: 2px;
          }

          .insight-text {
            font-size: 10px;
            color: #222;
            line-height: 1.5;
          }

          .footer {
            position: absolute;
            bottom: 0.2in;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7px;
            color: #CCC;
          }
        `}</style>
      </head>
      <body>
        <p className="the-label">THE</p>
        <h1 className="title">{titleWord}</h1>
        <p className="description">{card.description}</p>
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
