import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * OAuth callback handler. Supabase Auth redirects here after Google SSO.
 * Exchanges the auth code for a session, then redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate redirect path to prevent open redirects
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const SAFE_PREFIXES = ["/dashboard", "/onboarding", "/join", "/lessons", "/chat", "/plan", "/card", "/leaderboard", "/achievements", "/completion", "/instructor", "/parent", "/invention", "/aj", "/org", "/start"];
  const next = (rawNext.startsWith("/") && !rawNext.startsWith("//") && SAFE_PREFIXES.some(p => rawNext.startsWith(p)))
    ? rawNext
    : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this user has completed onboarding (has business_idea)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_idea, org_id, role, is_platform_owner, onboarding_step")
          .eq("id", user.id)
          .maybeSingle();

        // New user with no profile — route based on intent
        if (!profile) {
          const destination = next.includes("/start") ? "/start" : "/onboarding";
          return NextResponse.redirect(`${origin}${destination}`);
        }

        // ── ADMIN ROUTING — platform owners don't need onboarding ──
        if (profile?.is_platform_owner === true) {
          return NextResponse.redirect(`${origin}/admin`);
        }
        // Org admin with incomplete onboarding — resume wizard
        if (profile?.role === "org_admin") {
          const onboardingStep = (profile as Record<string, unknown>)?.onboarding_step as number ?? 0;
          if (onboardingStep < 6) {
            return NextResponse.redirect(`${origin}/start?step=${Math.max(onboardingStep, 1)}`);
          }
        }
        if (profile?.role === "instructor" || profile?.role === "org_admin") {
          return NextResponse.redirect(`${origin}/instructor/dashboard`);
        }

        // ── SUBDOMAIN MISMATCH CHECK ──
        // If user's org has a subdomain and they authenticated on a different
        // one, redirect them to their org's subdomain. Prevents cross-tenant
        // access. Platform owners are exempt (they access any subdomain).
        if (profile?.org_id && !(profile as Record<string, unknown>).is_platform_owner) {
          const requestHost = request.headers.get("host") ?? "";
          const requestSubdomain = requestHost.split(".").length >= 3 ? requestHost.split(".")[0] : null;

          if (requestSubdomain && requestSubdomain !== "www" && requestSubdomain !== "adaptable-one") {
            const admin = createAdminClient();
            const { data: userOrg } = await admin
              .from("organizations")
              .select("subdomain")
              .eq("id", profile.org_id)
              .single();

            if (userOrg?.subdomain && userOrg.subdomain !== requestSubdomain) {
              // User belongs to a different org than the subdomain they're on.
              // Use URL parsing (not String.replace) to avoid replacing
              // unintended substrings elsewhere in the origin.
              const url = new URL(origin);
              const hostParts = url.hostname.split(".");
              hostParts[0] = userOrg.subdomain;
              url.hostname = hostParts.join(".");
              return NextResponse.redirect(`${url.origin}${next}`);
            }
          }
        }

        // ── PROGRESS-FIRST RULE ──
        // If they have a business_idea, they have already completed
        // onboarding. NEVER bounce them backward to /join or /onboarding,
        // even if their org_id is null. The dashboard handles a missing
        // org gracefully and can prompt them to join a class as a soft
        // banner if needed. This prevents the regression that hit Alberto:
        // signing in with a complete business but null org_id and being
        // sent to /join as if he were a brand-new user.
        if (profile?.business_idea) {
          return NextResponse.redirect(`${origin}${next}`);
        }

        // No business idea yet — they're mid-onboarding.
        // Check if they have a class with a special session type.
        const { data: enrollment } = await supabase
          .from("class_enrollments")
          .select("class_id, classes(session_type)")
          .eq("student_id", user.id)
          .limit(1)
          .maybeSingle();

        const sessionType = enrollment
          ? (enrollment.classes as unknown as { session_type: string } | null)?.session_type
          : null;
        if (sessionType === "invention") {
          return NextResponse.redirect(`${origin}/invention`);
        }

        // Open platform: class enrollment is optional.
        // Send to onboarding (grade level + Ikigai) regardless of org_id.
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error: redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
