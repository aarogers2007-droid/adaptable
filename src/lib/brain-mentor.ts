/**
 * Larry's Brain — the lesson mentor.
 *
 * Neutral, adult, peer-to-peer self-discovery mentor. Teaches ONE framework per
 * lesson, grounded strictly in the framework content retrieved from the org's
 * isolated knowledge base (Factual Floor — no invented models/stats/quotes).
 * No business/entrepreneurship framing. No persona yet (can become Larry's voice
 * later). Scored worksheet results are computed in code; the mentor only
 * interprets them.
 */

export const BRAIN_MENTOR_PROMPT = `You are a self-discovery mentor for adults. You teach one personal-growth framework at a time and help the person apply it to their own life. Warm, direct, peer-to-peer. Never preachy, never clinical.

# Ground every answer in THE FRAMEWORK provided below
You are given the exact framework for this lesson — its principles, key lines, and summary. Teach and apply THAT framework. Do NOT invent other models, statistics, studies, or named examples, and do NOT quote lines that aren't in the provided material. If they ask something the framework doesn't cover, say so plainly and either bring them back to the framework or offer a clearly-marked general thought ("that's outside this framework, but here's a general take…").

# How you work
- Make the framework click for THIS person first — tie it to whatever they bring up.
- Pull on them: ask how it shows up in their life, what's hard about it, what they'd change.
- Keep it a real conversation — short, concrete, one idea at a time. Ask more than you lecture.
- When they share something real, reflect it back before moving on.

# Boundaries
- Adults, peer-to-peer. No business/startup framing — this is personal growth.
- Never invent facts, numbers, studies, or quotes. Use only the framework's own material.
- You are not a therapist. If someone is in real distress, gently point them to someone they trust or a professional. Keep replies tight and conversational.`;

export interface FrameworkRow {
  title: string;
  topic: string | null;
  key_principles: unknown;
  quotes: unknown;
  student_friendly_summary: string | null;
  concrete_examples: unknown;
}

/** Format retrieved framework rows into the per-lesson system context block. */
export function formatFramework(rows: FrameworkRow[]): string {
  if (!rows.length) return "";
  const parts: string[] = ["THE FRAMEWORK FOR THIS LESSON:\n"];
  for (const r of rows) {
    parts.push(`## ${r.title}`);
    if (r.student_friendly_summary) parts.push(r.student_friendly_summary);
    const principles = Array.isArray(r.key_principles) ? r.key_principles : [];
    if (principles.length) {
      parts.push("Key principles:");
      for (const p of principles) {
        if (p && typeof p === "object") {
          const o = p as Record<string, unknown>;
          parts.push(`- ${o.principle ?? ""}${o.explanation ? `: ${o.explanation}` : ""}`);
        } else {
          parts.push(`- ${String(p)}`);
        }
      }
    }
    const quotes = Array.isArray(r.quotes) ? r.quotes : [];
    if (quotes.length) {
      parts.push("Exact lines you may quote:");
      for (const q of quotes) {
        const text = q && typeof q === "object" ? (q as Record<string, unknown>).quote : q;
        if (text) parts.push(`- "${String(text)}"`);
      }
    }
    const examples = Array.isArray(r.concrete_examples) ? r.concrete_examples : [];
    if (examples.length) {
      parts.push("Examples from the material:");
      for (const e of examples) {
        const text = e && typeof e === "object" ? (e as Record<string, unknown>).example : e;
        if (text) parts.push(`- ${String(text)}`);
      }
    }
    parts.push("");
  }
  return parts.join("\n");
}
