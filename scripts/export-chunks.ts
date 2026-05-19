/**
 * Export the codebase in focused chunks for context-limited AI sessions.
 * Every file appears in exactly one chunk. Nothing omitted or summarized.
 *
 * Run: npx tsx scripts/export-chunks.ts
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const OUTPUT_DIR = join(ROOT, "exports");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".gstack", "exports"]);

// ── Redaction ──

function redact(content: string): string {
  return content.replace(
    /^(.*(?:API_KEY|SECRET|DATABASE_URL|SERVICE_ROLE)\s*=\s*).+$/gm,
    "$1[REDACTED]"
  ).replace(
    /sk-[a-zA-Z0-9]{20,}/g,
    "[REDACTED_KEY]"
  );
}

// ── File walking ──

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function rel(fullPath: string): string {
  return relative(ROOT, fullPath);
}

// ── Chunk definitions ──

interface ChunkDef {
  name: string;
  filename: string;
  paths: string[]; // relative paths or prefixes (directories end with /)
}

const CHUNKS: ChunkDef[] = [
  {
    name: "Demo and Data Pipeline",
    filename: "chunk-1-demo-pipeline.txt",
    paths: [
      "src/app/go/",
      "src/app/api/lesson-chat/route.ts",
      "src/app/api/scenario-chat/route.ts",
      "src/app/api/chat/route.ts",
      "src/lib/ai.ts",
      "src/lib/model-config.ts",
      "src/lib/crisis-detection.ts",
      "src/lib/crisis-resources.ts",
      "src/lib/teacher-alerts.ts",
      "src/app/(app)/lessons/[id]/LessonConversation.tsx",
      "supabase/migrations/00044_cache_tokens_log.sql",
      "supabase/migrations/00045_flywheel_views.sql",
      "supabase/migrations/00046_tighten_scenario_session_rls.sql",
      "supabase/migrations/00047_response_time_tracking.sql",
    ],
  },
  {
    name: "Core Platform Infrastructure",
    filename: "chunk-2-infrastructure.txt",
    paths: [
      "src/lib/supabase/",
      "src/lib/tenant/",
      "src/lib/branding.ts",
      "src/lib/get-tenant-branding.ts",
      "src/middleware.ts",
      "src/app/auth/",
      "src/app/layout.tsx",
      "src/lib/content-moderation.ts",
      "src/lib/ml-moderation.ts",
    ],
  },
  {
    name: "Student Curriculum",
    filename: "chunk-3-curriculum.txt",
    paths: [
      "src/app/(app)/lessons/",
      "src/app/(app)/onboarding/",
      "src/app/(app)/dashboard/",
      "src/app/(app)/leaderboard/",
      "src/lib/lesson-plans.ts",
      "src/lib/learning-profile.ts",
      "src/lib/knowledge-retrieval.ts",
      "src/lib/scenario-rubric.ts",
    ],
  },
  {
    name: "Scenarios and Achievements",
    filename: "chunk-4-scenarios.txt",
    paths: [
      "src/app/(app)/scenarios/",
      "src/app/(app)/chat/",
      "src/lib/achievements.ts",
      "src/lib/leaderboard.ts",
      "src/lib/engagement-context.ts",
      "src/lib/generate-card.ts",
    ],
  },
  {
    name: "Org Admin and Instructor",
    filename: "chunk-5-org-admin.txt",
    paths: [
      "src/app/instructor/",
      "src/app/(app)/org/",
      "src/app/(app)/admin/",
      "src/components/",
    ],
  },
  {
    name: "Types, Config, and Migrations",
    filename: "chunk-6-types-migrations.txt",
    paths: [
      "src/lib/types.ts",
      "src/lib/email.ts",
      "src/lib/grade-adaptation.ts",
      "package.json",
    ],
  },
];

// ── Matching logic ──

function fileMatchesChunk(relPath: string, chunk: ChunkDef): boolean {
  for (const p of chunk.paths) {
    if (p.endsWith("/")) {
      // Directory prefix match
      if (relPath.startsWith(p)) return true;
    } else {
      // Exact file match
      if (relPath === p) return true;
    }
  }
  return false;
}

// ── Main ──

function main() {
  // Collect all files
  const allFiles: string[] = [];
  for (const dir of [join(ROOT, "src"), join(ROOT, "supabase", "migrations")]) {
    allFiles.push(...walkDir(dir));
  }
  // Also include package.json
  const pkgPath = join(ROOT, "package.json");
  if (existsSync(pkgPath)) allFiles.push(pkgPath);

  allFiles.sort();

  const allRelPaths = allFiles.map(rel);

  // Assign each file to a chunk
  const assignments = new Map<string, number>(); // relPath → chunk index
  const unassigned: string[] = [];

  for (const relPath of allRelPaths) {
    let assigned = false;
    for (let i = 0; i < CHUNKS.length; i++) {
      if (fileMatchesChunk(relPath, CHUNKS[i])) {
        assignments.set(relPath, i);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      unassigned.push(relPath);
    }
  }

  // Put unassigned files into chunk 6 (Types, Config, and Migrations)
  // This catches remaining migrations (00001-00043), any src/lib/ files not
  // explicitly listed, and other misc files
  for (const relPath of unassigned) {
    assignments.set(relPath, 5); // chunk 6 (index 5)
  }

  // Build and write chunks
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: Array<{ name: string; files: number; chars: number }> = [];

  for (let i = 0; i < CHUNKS.length; i++) {
    const chunk = CHUNKS[i];
    const chunkFiles = allRelPaths.filter((rp) => assignments.get(rp) === i);

    const sections: string[] = [];
    sections.push(`=== CHUNK ${i + 1} OF 6: ${chunk.name} ===`);
    sections.push(`=== Total files in this chunk: ${chunkFiles.length} ===`);
    sections.push("");

    for (const relPath of chunkFiles) {
      const fullPath = join(ROOT, relPath);
      try {
        const raw = readFileSync(fullPath, "utf-8");
        const content = redact(raw);
        sections.push(`=== FILE: ${relPath} ===`);
        sections.push(content);
        sections.push("");
      } catch {
        sections.push(`=== FILE: ${relPath} ===`);
        sections.push("[UNREADABLE]");
        sections.push("");
      }
    }

    const output = sections.join("\n");
    const footer = `=== CHUNK COMPLETE: ${chunkFiles.length} files, ${output.length.toLocaleString()} characters ===\n=== MISSING FROM THIS CHUNK: none ===\n`;
    const finalOutput = output + "\n" + footer;

    writeFileSync(join(OUTPUT_DIR, chunk.filename), finalOutput, "utf-8");
    manifest.push({ name: chunk.name, files: chunkFiles.length, chars: finalOutput.length });
  }

  // Print manifest
  console.log("\n=== EXPORT MANIFEST ===\n");
  let totalFiles = 0;
  let totalChars = 0;
  for (let i = 0; i < manifest.length; i++) {
    const m = manifest[i];
    console.log(`  Chunk ${i + 1}: ${m.name}`);
    console.log(`    ${m.files} files, ${m.chars.toLocaleString()} chars`);
    console.log(`    → exports/${CHUNKS[i].filename}`);
    totalFiles += m.files;
    totalChars += m.chars;
  }
  console.log(`\n  Total: ${totalFiles} files, ${totalChars.toLocaleString()} chars`);

  // Cross-check
  const allSrcAndMigrations = allRelPaths.length;
  if (totalFiles === allSrcAndMigrations) {
    console.log(`\n  ✓ Cross-check PASSED: every file (${allSrcAndMigrations}) appears in exactly one chunk`);
  } else {
    console.log(`\n  ✗ Cross-check FAILED: ${totalFiles} assigned vs ${allSrcAndMigrations} total files`);
    if (totalFiles < allSrcAndMigrations) {
      const assignedSet = new Set(allRelPaths.filter((rp) => assignments.has(rp)));
      const missing = allRelPaths.filter((rp) => !assignedSet.has(rp));
      console.log(`    Missing: ${missing.join(", ")}`);
    }
  }

  console.log("");
}

main();
