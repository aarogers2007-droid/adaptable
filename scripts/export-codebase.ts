/**
 * Export the entire codebase to a single text file for external review.
 *
 * Reads: src/, supabase/migrations/
 * Skips: node_modules, .next, .git, files > 100KB
 * Redacts: API keys, secrets, connection strings
 *
 * Run: npx tsx scripts/export-codebase.ts
 */

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const OUTPUT_DIR = join(ROOT, "exports");
const OUTPUT_FILE = join(OUTPUT_DIR, "codebase-snapshot.txt");
const MAX_FILE_SIZE = 100 * 1024; // 100KB

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".gstack", "exports"]);

const SCAN_DIRS = [
  join(ROOT, "src"),
  join(ROOT, "supabase", "migrations"),
];

// Redaction patterns
const REDACT_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /(ANTHROPIC_API_KEY\s*=\s*).+/g, replacement: "$1[REDACTED]" },
  { pattern: /(OPENAI_API_KEY\s*=\s*).+/g, replacement: "$1[REDACTED]" },
  { pattern: /(SUPABASE_SERVICE_ROLE_KEY\s*=\s*).+/g, replacement: "$1[REDACTED]" },
  { pattern: /(DATABASE_URL\s*=\s*).+/g, replacement: "$1[REDACTED]" },
  { pattern: /(RESEND_API_KEY\s*=\s*).+/g, replacement: "$1[REDACTED]" },
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: "[REDACTED_KEY]" },
  { pattern: /ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: "[REDACTED_JWT]" },
];

function redact(content: string): string {
  let result = content;
  for (const { pattern, replacement } of REDACT_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function walkDir(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      try {
        const stat = statSync(fullPath);
        if (stat.size <= MAX_FILE_SIZE) {
          files.push(fullPath);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return files;
}

function main() {
  // Collect all files
  const allFiles: string[] = [];
  for (const dir of SCAN_DIRS) {
    allFiles.push(...walkDir(dir));
  }

  // Sort for consistent output
  allFiles.sort();

  // Build output
  const sections: string[] = [];

  for (const filePath of allFiles) {
    const relativePath = relative(ROOT, filePath);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const content = redact(raw);
      sections.push(`=== FILE: ${relativePath} ===\n${content}`);
    } catch {
      sections.push(`=== FILE: ${relativePath} ===\n[UNREADABLE]`);
    }
  }

  const output = sections.join("\n\n");

  // Write output
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, output, "utf-8");

  // Stats
  console.log(`Exported ${allFiles.length} files`);
  console.log(`Total characters: ${output.length.toLocaleString()}`);
  console.log(`Output: ${relative(ROOT, OUTPUT_FILE)}`);
}

main();
