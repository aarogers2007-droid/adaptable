import "server-only";

/**
 * CURRICULUM INGESTION PIPELINE — ORCHESTRATOR
 *
 * Coordinates the full pipeline: download → parse → chunk → embed → structure → lessons.
 * Handles errors per-file so one bad upload doesn't kill the entire pipeline.
 *
 * Phases:
 *   1. Download & parse files from Supabase storage (0-10%)
 *   2. Chunk all documents (10-20%)
 *   3. Insert chunks & embed them (20-50%)
 *   4. Structure into knowledge_base entries (50-75%)
 *   5. Generate lesson proposals (75-95%)
 *   6. Update upload statuses to 'completed' (95-100%)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { parseFile, type ParsedDocument } from "./parse";
import { chunkDocument, type CurriculumChunk } from "./chunk";
import { embedChunks } from "./embed";
import { structureKnowledge, type ChunkWithMeta } from "./structure";
import { generateLessons } from "./generate-lessons";

// ── Types ──

type ProgressCallback = (phase: string, progress: number, message: string) => void;

export interface PipelineResult {
  lessonCount: number;
  chunkCount: number;
}

// ── Storage bucket name ──

const CURRICULUM_BUCKET = "curriculum-files";

// ── Main orchestrator ──

/**
 * Run the full curriculum ingestion pipeline.
 *
 * Downloads files from Supabase storage, parses them, chunks the text,
 * generates embeddings, structures knowledge base entries, and proposes lessons.
 *
 * @param orgId - The organization ID
 * @param uploadIds - IDs from the curriculum_uploads table
 * @param onProgress - Callback for progress updates (phase, 0-100, message)
 * @returns Count of chunks and lessons created
 */
export async function runCurriculumPipeline(
  orgId: string,
  uploadIds: string[],
  onProgress: ProgressCallback
): Promise<PipelineResult> {
  const admin = createAdminClient();
  let totalChunks = 0;
  let totalLessons = 0;

  // ── Phase 1: Download & Parse (0-10%) ──

  onProgress("parse", 0, `Starting pipeline for ${uploadIds.length} file(s)...`);

  const parsedDocs: { fileName: string; doc: ParsedDocument; uploadId: string }[] = [];
  const failedUploads: string[] = [];

  for (let i = 0; i < uploadIds.length; i++) {
    const uploadId = uploadIds[i];
    const progressPct = Math.round((i / uploadIds.length) * 10);

    try {
      // Fetch upload metadata
      const { data: upload, error: metaError } = await admin
        .from("curriculum_uploads")
        .select("file_name, file_type, file_path")
        .eq("id", uploadId)
        .single();

      if (metaError || !upload) {
        throw new Error(`Upload ${uploadId} not found: ${metaError?.message ?? "no data"}`);
      }

      onProgress("parse", progressPct, `Downloading ${upload.file_name}...`);

      // Update status to processing
      await admin
        .from("curriculum_uploads")
        .update({ status: "processing" })
        .eq("id", uploadId);

      // Download file from storage
      const { data: fileData, error: downloadError } = await admin
        .storage
        .from(CURRICULUM_BUCKET)
        .download(upload.file_path);

      if (downloadError || !fileData) {
        throw new Error(`Download failed for ${upload.file_name}: ${downloadError?.message ?? "no data"}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      onProgress("parse", progressPct, `Parsing ${upload.file_name}...`);

      const doc = await parseFile(buffer, upload.file_type);

      if (doc.pages.length === 0) {
        throw new Error(`No text content extracted from ${upload.file_name}`);
      }

      parsedDocs.push({ fileName: upload.file_name, doc, uploadId });
      onProgress("parse", progressPct, `Parsed ${upload.file_name}: ${doc.pages.length} pages`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[curriculum/pipeline] Parse failed for upload ${uploadId}:`, message);
      onProgress("parse", progressPct, `Error: ${message}`);
      failedUploads.push(uploadId);

      // Mark upload as failed
      await admin
        .from("curriculum_uploads")
        .update({ status: "failed", error_message: message })
        .eq("id", uploadId);
    }
  }

  if (parsedDocs.length === 0) {
    onProgress("parse", 10, "No files could be parsed — pipeline stopped");
    return { lessonCount: 0, chunkCount: 0 };
  }

  onProgress("parse", 10, `Parsed ${parsedDocs.length}/${uploadIds.length} files successfully`);

  // ── Phase 2: Chunk (10-20%) ──

  onProgress("chunk", 10, "Chunking documents...");

  const allChunks: CurriculumChunk[] = [];

  for (const { fileName, doc } of parsedDocs) {
    const chunks = chunkDocument(doc, fileName);
    allChunks.push(...chunks);
  }

  totalChunks = allChunks.length;
  onProgress("chunk", 20, `Created ${totalChunks} chunks from ${parsedDocs.length} documents`);

  // ── Phase 3: Insert chunks & embed (20-50%) ──

  onProgress("embed", 20, "Inserting chunks into database...");

  // Insert chunks and collect their IDs
  const chunkIdsAndContent: { id: string; content: string }[] = [];

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const progressPct = 20 + Math.round((i / allChunks.length) * 10); // 20-30%

    const { data: inserted, error: insertError } = await admin
      .from("curriculum_chunks")
      .insert({
        org_id: orgId,
        content: chunk.content,
        source_file: chunk.sourceFile,
        source_page: chunk.sourcePage,
        chunk_index: chunk.chunkIndex,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error(`[curriculum/pipeline] Chunk insert failed:`, insertError?.message);
      continue;
    }

    chunkIdsAndContent.push({ id: inserted.id, content: chunk.content });

    if (i % 50 === 0) {
      onProgress("embed", progressPct, `Inserted ${i + 1}/${allChunks.length} chunks...`);
    }
  }

  onProgress("embed", 30, `Inserted ${chunkIdsAndContent.length} chunks — generating embeddings...`);

  // Generate embeddings in batches
  try {
    await embedChunks(chunkIdsAndContent);
    onProgress("embed", 50, `Embedded ${chunkIdsAndContent.length} chunks`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[curriculum/pipeline] Embedding failed:", message);
    onProgress("embed", 50, `Warning: Embedding failed (${message}) — continuing without embeddings`);
    // Continue — chunks are still usable for structuring even without embeddings
  }

  // ── Phase 4: Structure into knowledge_base (50-75%) ──

  onProgress("structure", 50, "Structuring curriculum into knowledge base entries...");

  const chunksWithMeta: ChunkWithMeta[] = allChunks.map((c) => ({
    content: c.content,
    sourceFile: c.sourceFile,
    sourcePage: c.sourcePage,
    chunkIndex: c.chunkIndex,
  }));

  await structureKnowledge(orgId, chunksWithMeta, (msg) => {
    onProgress("structure", 65, msg);
  });

  onProgress("structure", 75, "Knowledge base structuring complete");

  // ── Phase 5: Generate lesson proposals (75-95%) ──

  onProgress("lessons", 75, "Generating lesson proposals from knowledge base...");

  totalLessons = await generateLessons(orgId, (msg) => {
    onProgress("lessons", 85, msg);
  });

  onProgress("lessons", 95, `Generated ${totalLessons} lesson proposals`);

  // ── Phase 6: Update upload statuses (95-100%) ──

  onProgress("complete", 95, "Finalizing...");

  // Mark successful uploads as completed
  for (const { uploadId } of parsedDocs) {
    if (!failedUploads.includes(uploadId)) {
      await admin
        .from("curriculum_uploads")
        .update({ status: "completed" })
        .eq("id", uploadId);
    }
  }

  onProgress("complete", 100, `Pipeline complete: ${totalChunks} chunks, ${totalLessons} lessons`);

  return { lessonCount: totalLessons, chunkCount: totalChunks };
}
