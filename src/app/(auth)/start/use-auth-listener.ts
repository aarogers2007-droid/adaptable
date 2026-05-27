"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOnboardingContext } from "./actions";

/**
 * Listens for Supabase auth state changes (Google OAuth redirect).
 * Calls onSignIn when a new user signs in.
 * Runs once on mount, never re-subscribes.
 */
export function useAuthListener(
  onSignIn: (user: { id: string; email: string; fullName: string }, ctx: Awaited<ReturnType<typeof getOnboardingContext>>) => void
) {
  const calledRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user && !calledRef.current) {
          calledRef.current = true;
          const u = session.user;
          const ctx = await getOnboardingContext();
          onSignIn(
            { id: u.id, email: u.email ?? "", fullName: u.user_metadata?.full_name ?? "" },
            ctx
          );
        }
      }
    );
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
