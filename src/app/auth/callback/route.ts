import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler. Supabase Auth redirects here after Google SSO.
 * Exchanges the auth code for a session, then redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate redirect path to prevent open redirects
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const SAFE_PREFIXES = ["/dashboard", "/onboarding", "/join", "/lessons", "/chat", "/plan", "/card", "/leaderboard", "/achievements", "/completion", "/instructor", "/parent"];
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
          .select("business_idea, org_id")
          .eq("id", user.id)
          .single();

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
        // No org_id either: they need a class first.
        if (!profile?.org_id) {
          return NextResponse.redirect(`${origin}/join`);
        }

        // Has org but no business idea — start/resume the Ikigai wizard.
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error: redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
