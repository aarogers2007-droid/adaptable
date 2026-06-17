import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCurriculumPipeline } from "@/lib/curriculum/pipeline";
import { validateOrigin } from "@/lib/csrf";
// Admin client used for fetching upload IDs before pipeline runs

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // ── CSRF (fail closed) ──
  if (!validateOrigin(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Auth ──
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { orgId } = (await req.json()) as { orgId: string };

  if (!orgId) {
    return new Response(JSON.stringify({ error: "Missing orgId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Verify user is org_admin of this org ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role, is_platform_owner")
    .eq("id", user.id)
    .single();

  // Platform owners can run ingestion for any org they provision (e.g. onboarding
  // a new customer's curriculum). Everyone else must be an org_admin of THIS org.
  const isPlatformOwner = profile?.is_platform_owner === true;
  const isOrgAdmin = profile?.org_id === orgId && profile?.role === "org_admin";
  if (!isPlatformOwner && !isOrgAdmin) {
    return new Response(
      JSON.stringify({ error: "Not authorized for this organization" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── SSE stream ──
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Get pending upload IDs for this org
        const admin = createAdminClient();
        const { data: uploads } = await admin
          .from("curriculum_uploads")
          .select("id")
          .eq("org_id", orgId)
          .eq("status", "uploaded");

        const uploadIds = (uploads ?? []).map((u: { id: string }) => u.id);
        if (uploadIds.length === 0) {
          sendEvent({ phase: "error", progress: 0, message: "No files to process" });
          controller.close();
          return;
        }

        const result = await runCurriculumPipeline(orgId, uploadIds, (phase, progress, message) => {
          sendEvent({ phase, progress, message });
        });

        sendEvent({
          phase: "complete",
          progress: 100,
          message: "Done",
          lessonCount: result.lessonCount,
          chunkCount: result.chunkCount,
        });
      } catch (err) {
        console.error("[curriculum/process] Pipeline error:", err);
        sendEvent({
          phase: "error",
          progress: 0,
          message: err instanceof Error ? err.message : "Pipeline failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
