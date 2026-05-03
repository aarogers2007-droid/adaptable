import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface CardData {
  title: string;
  description: string;
  insights: { wish: string; mind: string; lens: string; scale: string; voice: string };
  shareable_slug: string;
}

// ── Metadata for social sharing ──

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = await fetchCardBySlug(slug);

  if (!card) {
    return { title: "Not Found" };
  }

  return {
    title: `${card.studentFirstName} is ${card.card.title} on Adaptable`,
    description: card.card.description,
  };
}

// ── Data fetching ──

async function fetchCardBySlug(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("invention_sessions")
    .select("generated_card, student_id")
    .eq("generated_card->>shareable_slug", slug)
    .not("generated_card", "is", null)
    .limit(1)
    .single();

  if (!data?.generated_card) return null;

  // Runtime allowlist — only extract fields needed for display.
  // The JSONB also contains grade_tier, model_used, etc. that must not
  // be exposed on the public page.
  const raw = data.generated_card as Record<string, unknown>;
  const insights = raw.insights as Record<string, string> | undefined;
  if (!raw.title || !raw.description || !insights) return null;

  const card: CardData = {
    title: raw.title as string,
    description: raw.description as string,
    insights: {
      wish: insights.wish ?? "",
      mind: insights.mind ?? "",
      lens: insights.lens ?? "",
      scale: insights.scale ?? "",
      voice: insights.voice ?? "",
    },
    shareable_slug: raw.shareable_slug as string,
  };

  // Get student first name only
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.student_id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Someone";

  return { card, studentFirstName: firstName };
}

// ── Page ──

const INSIGHT_LABELS = [
  { key: "wish", label: "THE WISH" },
  { key: "mind", label: "THE MIND" },
  { key: "lens", label: "THE LENS" },
  { key: "scale", label: "THE SCALE" },
  { key: "voice", label: "THE VOICE" },
] as const;

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchCardBySlug(slug);

  // Generic 404 — no info leakage about whether slug exists
  if (!result) notFound();

  const { card, studentFirstName } = result;
  const titleWord = card.title.replace(/^The\s+/i, "");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Student first name */}
      <p
        style={{
          fontSize: "13px",
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "16px",
        }}
      >
        {studentFirstName}
      </p>

      {/* Card */}
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#FAFAF8",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "32px",
        }}
      >
        <p style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          THE
        </p>
        <h1
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: "34px",
            fontWeight: 700,
            color: "#111",
            marginTop: "4px",
          }}
        >
          {titleWord}
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "#444", lineHeight: 1.6, marginTop: "16px" }}>
          {card.description}
        </p>
        <div style={{ height: "1px", background: "#E5E5E5", margin: "20px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {INSIGHT_LABELS.map((ins) => (
            <div key={ins.key} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <span style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.12em", width: "90px", flexShrink: 0, paddingTop: "3px" }}>
                {ins.label}
              </span>
              <span style={{ fontSize: "13px", color: "#222", lineHeight: 1.5 }}>
                {card.insights[ins.key as keyof typeof card.insights]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: "32px", fontSize: "11px", color: "#CCC" }}>
        adaptable.one
      </p>
    </main>
  );
}
