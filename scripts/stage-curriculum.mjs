/**
 * Stage local curriculum files for an org's ingestion pipeline.
 *
 * Uploads every PDF/DOCX/PPTX/TXT in a local folder to the `curriculum-files`
 * storage bucket under `${orgId}/`, and inserts a `curriculum_uploads` row
 * (status='uploaded') for each. After staging, trigger the pipeline via
 * POST /api/curriculum/process { orgId } while logged in as the org_admin OR a
 * platform owner.
 *
 * Usage:
 *   node --env-file=.env.local scripts/stage-curriculum.mjs <orgId> <folder>
 *
 * Defaults: Larry org + ./larry-pdfs
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname, basename } from "path";

const ORG_ID = process.argv[2] || "7857e627-6e92-4a07-b19f-dbf25e9b6ce8"; // Larry
const FOLDER = process.argv[3] || "larry-pdfs";
const BUCKET = "curriculum-files";

const CONTENT_TYPE = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local");
  process.exit(1);
}
const sb = createClient(url, key);

// uploaded_by is NOT NULL — use a platform owner as the uploader of record.
const { data: owner, error: ownerErr } = await sb
  .from("profiles")
  .select("id")
  .eq("is_platform_owner", true)
  .limit(1)
  .maybeSingle();
if (ownerErr || !owner) {
  console.error("Could not find a platform-owner profile for uploaded_by:", ownerErr?.message ?? "none found");
  process.exit(1);
}

let files;
try {
  files = readdirSync(FOLDER).filter((f) => {
    const ext = extname(f).slice(1).toLowerCase();
    return ext in CONTENT_TYPE && statSync(join(FOLDER, f)).isFile();
  });
} catch (e) {
  console.error(`Cannot read folder "${FOLDER}":`, e.message);
  process.exit(1);
}
if (files.length === 0) {
  console.error(`No PDF/DOCX/PPTX/TXT files found in "${FOLDER}". Drop the files there first.`);
  process.exit(1);
}

console.log(`Staging ${files.length} file(s) for org ${ORG_ID} from ${FOLDER}/\n`);
const uploadIds = [];
for (const name of files) {
  const buf = readFileSync(join(FOLDER, name));
  const ext = extname(name).slice(1).toLowerCase();
  const storagePath = `${ORG_ID}/${name}`;

  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: CONTENT_TYPE[ext], upsert: true });
  if (upErr) {
    console.error(`  ✗ upload failed for ${name}: ${upErr.message}`);
    continue;
  }

  const { data: row, error: rowErr } = await sb
    .from("curriculum_uploads")
    .insert({
      org_id: ORG_ID,
      uploaded_by: owner.id,
      file_name: name,
      file_path: storagePath,
      file_size_bytes: buf.length,
      file_type: ext,
      status: "uploaded",
      ip_consent_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (rowErr || !row) {
    console.error(`  ✗ row insert failed for ${name}: ${rowErr?.message}`);
    continue;
  }
  uploadIds.push(row.id);
  console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(0)} KB) → ${storagePath}`);
}

console.log(`\nStaged ${uploadIds.length}/${files.length} file(s).`);
console.log(`Next: trigger POST /api/curriculum/process { "orgId": "${ORG_ID}" } as platform owner.`);
