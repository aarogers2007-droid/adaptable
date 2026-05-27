import "server-only";

/**
 * CURRICULUM DOCUMENT CHUNKER
 *
 * Splits parsed documents into overlapping chunks suitable for
 * embedding and retrieval. Uses recursive character splitting with
 * page boundary preservation.
 *
 * Target: ~1500 tokens per chunk (approx 6000 chars), 200 token overlap (800 chars).
 */

import type { ParsedDocument } from "./parse";

// ── Types ──

export interface CurriculumChunk {
  content: string;
  sourceFile: string;
  sourcePage: number | null;
  chunkIndex: number;
}

// ── Config ──

const MAX_CHUNK_CHARS = 6000; // ~1500 tokens
const OVERLAP_CHARS = 800;    // ~200 tokens

// Separators in priority order for recursive splitting
const SEPARATORS = [
  "\n\n\n",  // Triple newline (section break)
  "\n\n",    // Double newline (paragraph break)
  "\n",      // Single newline
  ". ",      // Sentence boundary
  "? ",      // Question boundary
  "! ",      // Exclamation boundary
  "; ",      // Semicolon boundary
  ", ",      // Comma boundary
  " ",       // Word boundary
];

// ── Recursive splitter ──

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) {
    return [text];
  }

  // Try each separator in priority order
  for (const sep of SEPARATORS) {
    const parts = text.split(sep);
    if (parts.length <= 1) continue;

    // Greedily merge parts into chunks that fit within maxLen
    const merged: string[] = [];
    let current = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const candidate = current + sep + parts[i];
      if (candidate.length <= maxLen) {
        current = candidate;
      } else {
        if (current.trim()) merged.push(current);
        current = parts[i];
      }
    }
    if (current.trim()) merged.push(current);

    // If we actually split, recursively split any pieces still too long
    if (merged.length > 1 || merged[0].length <= maxLen) {
      const result: string[] = [];
      for (const piece of merged) {
        if (piece.length > maxLen) {
          result.push(...splitText(piece, maxLen));
        } else {
          result.push(piece);
        }
      }
      return result;
    }
  }

  // Last resort: hard split at maxLen
  const result: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    result.push(text.slice(i, i + maxLen));
  }
  return result;
}

// ── Add overlap between chunks ──

function addOverlap(chunks: string[]): string[] {
  if (chunks.length <= 1) return chunks;

  const result: string[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    // Grab the tail of the previous chunk as overlap prefix
    const prevChunk = chunks[i - 1];
    const overlapStart = Math.max(0, prevChunk.length - OVERLAP_CHARS);
    const overlap = prevChunk.slice(overlapStart);

    // Find a clean break point in the overlap (sentence or newline)
    let cleanBreak = overlap.lastIndexOf(". ");
    if (cleanBreak === -1) cleanBreak = overlap.lastIndexOf("\n");
    if (cleanBreak === -1) cleanBreak = overlap.lastIndexOf(" ");

    const cleanOverlap = cleanBreak > 0
      ? overlap.slice(cleanBreak + 1).trim()
      : overlap.trim();

    if (cleanOverlap) {
      result.push(cleanOverlap + "\n\n" + chunks[i]);
    } else {
      result.push(chunks[i]);
    }
  }

  return result;
}

// ── Main chunking function ──

/**
 * Chunk a parsed document into overlapping text segments.
 * Preserves page boundaries where possible — a chunk won't span
 * pages unless a single page exceeds the chunk size limit.
 */
export function chunkDocument(doc: ParsedDocument, sourceFile: string): CurriculumChunk[] {
  const allChunks: CurriculumChunk[] = [];
  let globalIndex = 0;

  // First pass: group adjacent pages that together fit in one chunk
  const groups: { pages: number[]; text: string }[] = [];
  let currentGroup: { pages: number[]; text: string } = { pages: [], text: "" };

  for (const page of doc.pages) {
    const candidateText = currentGroup.text
      ? currentGroup.text + "\n\n" + page.text
      : page.text;

    if (candidateText.length <= MAX_CHUNK_CHARS) {
      // Fits in current group
      currentGroup.text = candidateText;
      currentGroup.pages.push(page.pageNumber);
    } else {
      // Flush current group if non-empty
      if (currentGroup.text.trim()) {
        groups.push({ ...currentGroup });
      }
      currentGroup = { pages: [page.pageNumber], text: page.text };
    }
  }
  if (currentGroup.text.trim()) {
    groups.push(currentGroup);
  }

  // Second pass: split each group into chunks if needed, then add overlap
  for (const group of groups) {
    const rawPieces = splitText(group.text, MAX_CHUNK_CHARS);
    const withOverlap = addOverlap(rawPieces);

    const firstPage = group.pages[0] ?? null;

    for (const content of withOverlap) {
      if (content.trim()) {
        allChunks.push({
          content: content.trim(),
          sourceFile,
          sourcePage: firstPage,
          chunkIndex: globalIndex++,
        });
      }
    }
  }

  return allChunks;
}
