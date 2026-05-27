import "server-only";

/**
 * CURRICULUM CHUNK EMBEDDER
 *
 * Generates OpenAI text-embedding-3-small embeddings for curriculum chunks
 * and stores them in the curriculum_chunks table. Processes in batches of 100
 * to respect API rate limits.
 *
 * Uses the same embedding model (1536 dims) as the knowledge_base embeddings
 * in scripts/generate-embeddings.ts.
 */

import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Config ──

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;

// ── Types ──

interface ChunkInput {
  id: string;
  content: string;
}

// ── Main function ──

/**
 * Generate embeddings for a batch of chunks and update them in the database.
 * Processes in batches of 100 to stay within OpenAI rate limits.
 *
 * @param chunks - Array of { id, content } where id is the curriculum_chunks row id
 */
export async function embedChunks(chunks: ChunkInput[]): Promise<void> {
  if (chunks.length === 0) return;

  const openai = new OpenAI();
  const admin = createAdminClient();

  // Process in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((c) => c.content),
    });

    // Update each chunk with its embedding
    const updates = response.data.map((item, idx) => ({
      id: batch[idx].id,
      embedding: JSON.stringify(item.embedding),
    }));

    for (const update of updates) {
      const { error } = await admin
        .from("curriculum_chunks")
        .update({ embedding: update.embedding })
        .eq("id", update.id);

      if (error) {
        console.error(`[curriculum/embed] Failed to store embedding for chunk ${update.id}:`, error.message);
      }
    }
  }
}
