"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ONBOARDING_STEP, type DraftLesson } from "./constants";

// ─── Reserved subdomains ───

const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "adaptable", "mail", "ftp",
  "staging", "demo", "test", "dev", "beta", "status", "help",
  "support", "docs", "blog", "cdn", "assets", "static",
]);

const SUBDOMAIN_REGEX = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

// ─── Helpers ───

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

// ─── Action 1: Get onboarding context for wizard resume ───

export async function getOnboardingContext(): Promise<{
  user: { id: string; email: string; fullName: string } | null;
  org: { id: string; name: string; subdomain: string; brandingConfig: Record<string, unknown> } | null;
  onboardingStep: number;
  inviteCode: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, org: null, onboardingStep: 0, inviteCode: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, full_name, onboarding_step")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      user: { id: user.id, email: user.email ?? "", fullName: "" },
      org: null,
      onboardingStep: ONBOARDING_STEP.ACCOUNT_CREATED,
      inviteCode: null,
    };
  }

  let org: { id: string; name: string; subdomain: string; brandingConfig: Record<string, unknown> } | null = null;
  let inviteCode: string | null = null;

  if (profile.org_id) {
    const admin = createAdminClient();

    const { data: orgData } = await admin
      .from("organizations")
      .select("id, name, subdomain, branding_config")
      .eq("id", profile.org_id)
      .single();

    if (orgData) {
      org = {
        id: orgData.id,
        name: orgData.name,
        subdomain: orgData.subdomain,
        brandingConfig: (orgData.branding_config as Record<string, unknown>) ?? {},
      };
    }

    // Find invite code via classes
    const { data: classData } = await admin
      .from("classes")
      .select("id")
      .eq("org_id", profile.org_id)
      .limit(1)
      .single();

    if (classData) {
      const { data: codeData } = await admin
        .from("invite_codes")
        .select("code")
        .eq("class_id", classData.id)
        .limit(1)
        .single();

      inviteCode = codeData?.code ?? null;
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile.full_name ?? "",
    },
    org,
    onboardingStep: profile.onboarding_step ?? ONBOARDING_STEP.ACCOUNT_CREATED,
    inviteCode,
  };
}

// ─── Action 2: Create organization stub ───

export async function createOrgStub(
  orgName: string,
  subdomain: string
): Promise<
  | { success: true; orgId: string; inviteCode: string }
  | { error: string; goToStep?: number }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Guard: idempotent — if user already has an org at step >= 2, return it
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, onboarding_step")
    .eq("id", user.id)
    .single();

  if (profile?.org_id && (profile.onboarding_step ?? 0) >= ONBOARDING_STEP.ORG_NAMED) {
    // Return existing org info
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("id", profile.org_id)
      .single();

    if (existingOrg) {
      // Find existing invite code
      const { data: cls } = await admin
        .from("classes")
        .select("id")
        .eq("org_id", existingOrg.id)
        .limit(1)
        .single();

      let existingCode = "";
      if (cls) {
        const { data: codeRow } = await admin
          .from("invite_codes")
          .select("code")
          .eq("class_id", cls.id)
          .limit(1)
          .single();
        existingCode = codeRow?.code ?? "";
      }

      return { success: true, orgId: existingOrg.id, inviteCode: existingCode };
    }
  }

  // Validate org name
  const trimmedName = orgName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return { error: "Organization name must be 2-100 characters." };
  }

  // Validate subdomain
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  if (!SUBDOMAIN_REGEX.test(normalizedSubdomain)) {
    return {
      error: "Subdomain must be 3-32 characters, lowercase letters, numbers, and hyphens.",
      goToStep: ONBOARDING_STEP.ACCOUNT_CREATED,
    };
  }
  if (RESERVED_SUBDOMAINS.has(normalizedSubdomain)) {
    return {
      error: "This subdomain is reserved.",
      goToStep: ONBOARDING_STEP.ACCOUNT_CREATED,
    };
  }

  const slug = toSlug(trimmedName);

  const brandingConfig = {
    platform_name: trimmedName,
    primary_color: "#0D9488",
    secondary_color: "#C084FC",
    logo_url: "",
    favicon_url: "",
    welcome_message: "",
    support_email: "",
    domain: `${normalizedSubdomain}.adaptable.one`,
  };

  // Create the organization
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: trimmedName,
      slug,
      subdomain: normalizedSubdomain,
      branding_config: brandingConfig,
      subscription_tier: "starter",
      is_active: false,
    })
    .select("id")
    .single();

  if (orgError) {
    if (orgError.code === "23505") {
      return {
        error: "This subdomain was just claimed by another organization. Please choose a different one.",
        goToStep: ONBOARDING_STEP.ACCOUNT_CREATED,
      };
    }
    console.error("[start/actions] org creation failed:", orgError);
    return { error: "Failed to create organization. Please try again." };
  }

  const orgId = org.id;

  // Update profile: assign org, set role, advance step
  await admin
    .from("profiles")
    .update({
      org_id: orgId,
      role: "org_admin",
      onboarding_step: ONBOARDING_STEP.ORG_NAMED,
    })
    .eq("id", user.id);

  // Create Welcome Class
  const { data: cls } = await admin
    .from("classes")
    .insert({
      org_id: orgId,
      instructor_id: user.id,
      name: "Welcome Class",
      session_type: "curriculum",
    })
    .select("id")
    .single();

  // Create invite code derived from org name
  let inviteCode = "";
  if (cls) {
    const baseCode = trimmedName
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "WELCOME";

    for (let i = 1; i <= 99; i++) {
      const code = `${baseCode}${i}`.slice(0, 8);
      const { error: codeError } = await admin.from("invite_codes").insert({
        code,
        class_id: cls.id,
        created_by: user.id,
        max_uses: 200,
        current_uses: 0,
      });
      if (!codeError) {
        inviteCode = code;
        break;
      }
    }
  }

  return { success: true, orgId, inviteCode };
}

// ─── Action 3: Check subdomain availability ───

export async function checkSubdomainAvailability(subdomain: string): Promise<{
  available: boolean;
  error?: string;
}> {
  const normalized = subdomain.toLowerCase().trim();

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      available: false,
      error: "Must be 3-32 characters, lowercase letters, numbers, and hyphens.",
    };
  }

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { available: false, error: "This subdomain is reserved." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("subdomain", normalized)
    .limit(1)
    .single();

  return { available: !data };
}

// ─── Action 4: Save branding ───

export async function saveBranding(
  orgId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const admin = createAdminClient();

  const logoFile = formData.get("logo") as File | null;
  const primaryColor = ((formData.get("primaryColor") as string) ?? "") || "#0D9488";
  const secondaryColor = ((formData.get("secondaryColor") as string) ?? "") || "#C084FC";

  // Get existing branding config to merge
  const { data: orgData } = await admin
    .from("organizations")
    .select("branding_config")
    .eq("id", orgId)
    .single();

  const existingConfig = (orgData?.branding_config as Record<string, unknown>) ?? {};
  let logoUrl = (existingConfig.logo_url as string) ?? "";

  // Server-side file validation
  if (logoFile && logoFile.size > 0) {
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

    if (logoFile.size > MAX_FILE_SIZE) {
      return { error: "Logo file must be under 2MB." };
    }
    if (!ALLOWED_TYPES.includes(logoFile.type)) {
      return { error: "Logo must be PNG, JPG, or SVG." };
    }
  }

  // Upload logo if provided
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.type === "image/svg+xml" ? "svg"
      : logoFile.type === "image/jpeg" ? "jpg" : "png";
    const { error: uploadError } = await supabase.storage
      .from("branding-assets")
      .upload(`${orgId}/logo.${ext}`, logoFile, {
        contentType: logoFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("branding-assets")
        .getPublicUrl(`${orgId}/logo.${ext}`);
      logoUrl = urlData.publicUrl;
    } else {
      console.error("[start/actions] logo upload failed:", uploadError);
      // Non-fatal: branding can still be saved without logo
    }
  }

  const updatedConfig = {
    ...existingConfig,
    logo_url: logoUrl,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
  };

  await admin
    .from("organizations")
    .update({ branding_config: updatedConfig })
    .eq("id", orgId);

  // Advance onboarding step
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.BRANDED })
    .eq("id", user.id);

  return { success: true };
}

// ─── Action 5: Activate subscription after Stripe checkout ───

// activateSubscription lives in ./stripe-actions.ts to isolate the Stripe SDK import

// ─── Action 6: Upload curriculum files ───

const MAX_CURRICULUM_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CURRICULUM_FILES = 20;
const ALLOWED_CURRICULUM_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
};

export async function uploadCurriculumFiles(
  orgId: string,
  formData: FormData
): Promise<{ success: true; uploadIds: string[] } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const files = formData.getAll("files") as File[];
  if (!files.length) return { error: "No files provided." };
  if (files.length > MAX_CURRICULUM_FILES) {
    return { error: `Maximum ${MAX_CURRICULUM_FILES} files allowed.` };
  }

  // Validate all files before uploading any
  for (const file of files) {
    if (file.size > MAX_CURRICULUM_FILE_SIZE) {
      return { error: `File "${file.name}" exceeds 50MB limit.` };
    }
    if (!ALLOWED_CURRICULUM_TYPES[file.type]) {
      return { error: `File "${file.name}" is not an allowed type. Use PDF, DOCX, PPTX, or TXT.` };
    }
  }

  const admin = createAdminClient();
  const uploadIds: string[] = [];

  for (const file of files) {
    const fileType = ALLOWED_CURRICULUM_TYPES[file.type];
    const storagePath = `${orgId}/${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("curriculum-files")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[start/actions] curriculum file upload failed:", uploadError);
      return { error: `Failed to upload "${file.name}". Please try again.` };
    }

    // Insert curriculum_uploads row
    const { data: row, error: insertError } = await admin
      .from("curriculum_uploads")
      .insert({
        org_id: orgId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: storagePath,
        file_size_bytes: file.size,
        file_type: fileType,
        ip_consent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[start/actions] curriculum_uploads insert failed:", insertError);
      return { error: `Failed to record upload for "${file.name}".` };
    }

    uploadIds.push(row.id);
  }

  return { success: true, uploadIds };
}

// ─── Action 7: Approve draft lessons ───

export async function approveDraftLessons(
  orgId: string,
  approvedIds: string[],
  edits: Record<string, { title?: string; objective?: string }>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const admin = createAdminClient();

  // Fetch all approved drafts
  const { data: drafts, error: fetchError } = await admin
    .from("curriculum_draft_lessons")
    .select("*")
    .eq("org_id", orgId)
    .in("id", approvedIds);

  if (fetchError || !drafts?.length) {
    return { error: "No draft lessons found to approve." };
  }

  for (const draft of drafts) {
    const draftEdits = edits[draft.id];
    const title = draftEdits?.title ?? draft.title;
    const objective = draftEdits?.objective ?? draft.objective;

    // Mark draft as approved (apply edits if any)
    await admin
      .from("curriculum_draft_lessons")
      .update({
        status: "approved",
        title,
        objective,
      })
      .eq("id", draft.id);

    // Insert into lessons table
    await admin.from("lessons").insert({
      org_id: orgId,
      title,
      objective,
      module_name: draft.module_name,
      module_sequence: draft.module_sequence,
      lesson_sequence: draft.lesson_sequence,
      content_template: (draft.ai_generated_plan as Record<string, unknown>) ?? {},
    });

    // Insert/update knowledge_base lesson_tags for this lesson
    // Link the source chunks to knowledge base via lesson tags if applicable
    if (draft.source_chunk_ids?.length) {
      const { data: chunks } = await admin
        .from("curriculum_chunks")
        .select("id")
        .eq("org_id", orgId)
        .in("id", draft.source_chunk_ids);

      if (chunks?.length) {
        for (const chunk of chunks) {
          await admin.from("knowledge_base").upsert(
            {
              org_id: orgId,
              title: `Curriculum: ${title}`,
              lesson_tags: [title],
              student_friendly_summary: objective ?? "",
              verified: false,
            },
            { onConflict: "org_id,title" }
          ).select("id");
        }
      }
    }
  }

  // Update organization curriculum_source
  await admin
    .from("organizations")
    .update({ curriculum_source: "custom" })
    .eq("id", orgId);

  // Advance onboarding step
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.CURRICULUM })
    .eq("id", user.id);

  return { success: true };
}

// ─── Action 8: Skip curriculum (use defaults) ───

export async function skipCurriculum(
  orgId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const admin = createAdminClient();

  // Set curriculum source to default
  await admin
    .from("organizations")
    .update({ curriculum_source: "default" })
    .eq("id", orgId);

  // Advance onboarding step
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.CURRICULUM })
    .eq("id", user.id);

  return { success: true };
}

// ─── Action 9: Get draft lessons ───

export async function getDraftLessons(
  orgId: string
): Promise<DraftLesson[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return [];
  }

  const admin = createAdminClient();

  const { data: drafts } = await admin
    .from("curriculum_draft_lessons")
    .select("id, title, objective, module_name, module_sequence, lesson_sequence, ai_generated_plan, status, created_at")
    .eq("org_id", orgId)
    .in("status", ["proposed", "edited"])
    .order("module_sequence", { ascending: true })
    .order("lesson_sequence", { ascending: true });

  return (drafts ?? []) as DraftLesson[];
}

// ─── Action 10: Launch program (final step) ───

export async function launchProgram(
  orgId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is org_admin of this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (profile?.org_id !== orgId || profile?.role !== "org_admin") {
    return { error: "Unauthorized: you are not the admin of this organization." };
  }

  const admin = createAdminClient();

  // Verify curriculum readiness
  const { data: org } = await admin
    .from("organizations")
    .select("curriculum_source")
    .eq("id", orgId)
    .single();

  if (org?.curriculum_source === "custom") {
    // Must have at least 1 approved lesson
    const { count } = await admin
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (!count || count < 1) {
      return { error: "Upload curriculum or choose the default before launching." };
    }
  } else if (org?.curriculum_source !== "default") {
    return { error: "Upload curriculum or choose the default before launching." };
  }

  // Activate the organization
  await admin
    .from("organizations")
    .update({ is_active: true })
    .eq("id", orgId);

  // Advance onboarding step to complete
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.COMPLETE })
    .eq("id", user.id);

  return { success: true };
}
