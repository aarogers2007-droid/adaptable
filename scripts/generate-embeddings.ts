/**
 * KNOWLEDGE BASE EMBEDDING GENERATOR
 *
 * Generates OpenAI text-embedding-3-small embeddings for all knowledge_base
 * entries and stores them in the existing `embedding` vector(1536) column.
 *
 * Run after seeding new knowledge base entries or updating existing ones.
 *
 * Prerequisites:
 *   - OPENAI_API_KEY in .env.local
 *   - knowledge_base table with embedding column (vector(1536))
 *
 * Usage: npx tsx scripts/generate-embeddings.ts
 */

import { readFileSync } from "fs";
import path from "path";

// Load env
const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not found in .env.local");
  console.error("Add it: echo 'OPENAI_API_KEY=sk-...' >> .env.local");
  process.exit(1);
}

const openai = new OpenAI();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMBEDDING_MODEL = "text-embedding-3-small";

interface KBEntry {
  id: string;
  title: string;
  topic: string;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string }[];
  student_friendly_summary: string;
}

function buildEmbeddingText(entry: KBEntry): string {
  const principles = entry.key_principles
    .map((p) => `${p.principle}: ${p.explanation}`)
    .join("\n");
  const examples = entry.concrete_examples
    .map((e) => `${e.example} (${e.business_type}): ${e.lesson}`)
    .join("\n");
  const quotes = entry.quotes
    .map((q) => `"${q.quote}" — ${q.source}`)
    .join("\n");

  return `${entry.title}\n\n${entry.topic}\n\nKey Principles:\n${principles}\n\nExamples:\n${examples}\n\nQuotes:\n${quotes}\n\nSummary: ${entry.student_friendly_summary}`;
}

async function main() {
  console.log("=== KNOWLEDGE BASE EMBEDDING GENERATOR ===");
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log("");

  // Fetch all entries
  const { data: entries, error } = await supabase
    .from("knowledge_base")
    .select("id, title, topic, key_principles, concrete_examples, quotes, student_friendly_summary")
    .order("created_at");

  if (error || !entries) {
    console.error("Failed to fetch knowledge_base:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${entries.length} entries`);
  console.log("");

  let updated = 0;
  let failed = 0;

  for (const entry of entries as KBEntry[]) {
    const text = buildEmbeddingText(entry);
    process.stdout.write(`  ${entry.title.slice(0, 60).padEnd(60)} `);

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });

      const embedding = response.data[0].embedding;

      const { error: updateError } = await supabase
        .from("knowledge_base")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", entry.id);

      if (updateError) {
        console.log(`STORE ERROR: ${updateError.message}`);
        failed++;
      } else {
        console.log(`✅ ${embedding.length} dims`);
        updated++;
      }
    } catch (e) {
      console.log(`EMBED ERROR: ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }

  console.log("");
  console.log(`Done: ${updated} embedded, ${failed} failed, ${entries.length} total`);

  // Verify
  const { count } = await supabase
    .from("knowledge_base")
    .select("id", { count: "exact", head: true })
    .not("embedding", "is", null);
  console.log(`Verification: ${count}/${entries.length} entries have embeddings`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
