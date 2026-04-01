import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler. Supabase Auth redirects here after Google SSO.
 * Exchanges the auth code for a session, then redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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

        // New user without an org: needs to join a class first
        if (!profile?.org_id) {
          return NextResponse.redirect(`${origin}/join`);
        }

        // User without business idea: needs to complete Ikigai
        if (!profile?.business_idea) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error: redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
