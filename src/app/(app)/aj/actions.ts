"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Platform-owner curriculum ingestion actions for the /aj drag-and-drop menu.
// Mirror the org-admin upload action in (auth)/start/actions.ts, but gate on
// is_platform_owner so AJ can onboard ANY org's curriculum from one place.
// The actual pipeline is triggered client-side via /api/curriculum/process
// (which also allows platform owners — commit 61d7fcf).

const MAX_CURRICULUM_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CURRICULUM_FILES = 20;
const ALLOWED_CURRICULUM_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
};

async function requirePlatformOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_owner")
    .eq("id", user.id)
    .single();
  if (!profile?.is_platform_owner) return { error: "Platform owners only." as const };
  return { user };
}

/** List all orgs for the ingest target dropdown. Platform owner only. */
export async function listOrgsForIngest(): Promise<
  { orgs: { id: string; name: string; slug: string | null }[] } | { error: string }
> {
  const gate = await requirePlatformOwner();
  if ("error" in gate) return { error: gate.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("id, name, slug")
    .order("name", { ascending: true });
  if (error) {
    console.error("[aj/actions] listOrgsForIngest failed:", error.message);
    return { error: "Could not load organizations." };
  }
  return { orgs: data ?? [] };
}

/**
 * Upload curriculum files to a target org's storage + create curriculum_uploads
 * rows (status defaults to 'uploaded'). Returns the upload IDs so the client can
 * trigger /api/curriculum/process. Platform owner only.
 */
export async function uploadCurriculumForOrg(
  orgId: string,
  formData: FormData
): Promise<{ success: true; uploadIds: string[] } | { error: string }> {
  const gate = await requirePlatformOwner();
  if ("error" in gate) return { error: gate.error };

  if (!orgId || typeof orgId !== "string") return { error: "Pick an organization first." };

  const files = formData.getAll("files") as File[];
  if (!files.length) return { error: "No files provided." };
  if (files.length > MAX_CURRICULUM_FILES) {
    return { error: `Maximum ${MAX_CURRICULUM_FILES} files allowed.` };
  }

  // Validate everything before uploading any.
  for (const file of files) {
    if (file.size > MAX_CURRICULUM_FILE_SIZE) {
      return { error: `File "${file.name}" exceeds 50MB limit.` };
    }
    if (!ALLOWED_CURRICULUM_TYPES[file.type]) {
      return { error: `File "${file.name}" is not allowed. Use PDF, DOCX, PPTX, or TXT.` };
    }
  }

  const admin = createAdminClient();
  const uploadIds: string[] = [];

  for (const file of files) {
    const fileType = ALLOWED_CURRICULUM_TYPES[file.type];
    const storagePath = `${orgId}/${file.name}`;

    const { error: uploadError } = await admin.storage
      .from("curriculum-files")
      .upload(storagePath, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      console.error("[aj/actions] upload failed:", uploadError.message);
      return { error: `Failed to upload "${file.name}".` };
    }

    const { data: row, error: insertError } = await admin
      .from("curriculum_uploads")
      .insert({
        org_id: orgId,
        uploaded_by: gate.user.id,
        file_name: file.name,
        file_path: storagePath,
        file_size_bytes: file.size,
        file_type: fileType,
        ip_consent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertError || !row) {
      console.error("[aj/actions] curriculum_uploads insert failed:", insertError?.message);
      return { error: `Failed to record "${file.name}".` };
    }
    uploadIds.push(row.id);
  }

  return { success: true, uploadIds };
}
