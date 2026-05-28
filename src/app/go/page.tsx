"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useBranding } from "@/components/BrandingProvider";

/**
 * Guest join page for live events.
 * No signup, no email, no Google SSO.
 * Student enters a class code + first name → anonymous session → straight to onboarding.
 *
 * Requires Supabase anonymous sign-in to be enabled in the dashboard:
 * Authentication → Sign In / Up → Anonymous Sign-Ins → ON
 */
export default function GuestJoinPage() {
  const branding = useBranding();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  async function handleJoin() {
    if (attempts >= 10) {
      setError("Too many attempts. Please wait a few minutes and refresh the page.");
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Enter a class code.");
      return;
    }

    if (!trimmedName) {
      setError("Enter your first name.");
      return;
    }

    setAttempts((prev) => prev + 1);
    setJoining(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1. Validate the class code
      const { data: inviteCode, error: codeError } = await supabase
        .from("invite_codes")
        .select("code, class_id, max_uses, current_uses")
        .eq("code", trimmedCode)
        .single();

      if (codeError || !inviteCode) {
        setError("That code doesn't work. Check with the person who gave it to you.");
        setJoining(false);
        return;
      }

      if (inviteCode.current_uses >= inviteCode.max_uses) {
        setError("This program is full. Let your program coordinator know.");
        setJoining(false);
        return;
      }

      // 2. Get the class to find the org_id
      const { data: classData } = await supabase
        .from("classes")
        .select("id, org_id")
        .eq("id", inviteCode.class_id)
        .single();

      if (!classData) {
        setError("Class not found. Check the code.");
        setJoining(false);
        return;
      }

      // 3. Create anonymous session
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError || !authData.user) {
        console.error("[go] anonymous sign-in failed:", authError);
        setError("Could not create your session. Try again.");
        setJoining(false);
        return;
      }

      const userId = authData.user.id;

      // 4. Create/update profile with org and name
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          role: "student",
          org_id: classData.org_id,
          full_name: trimmedName,
        }, { onConflict: "id" });

      // 5. Enroll in the class
      await supabase
        .from("class_enrollments")
        .insert({
          student_id: userId,
          class_id: classData.id,
        });

      // 6. Increment invite code usage
      await supabase
        .from("invite_codes")
        .update({ current_uses: inviteCode.current_uses + 1 })
        .eq("code", trimmedCode);

      // 7. Go straight to onboarding
      router.push("/onboarding");

    } catch (err) {
      console.error("[go] join failed:", err);
      setError("Something went wrong. Try again.");
      setJoining(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {branding.logo_url && (
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.logo_url} alt={branding.platform_name} className="h-12 w-auto object-contain" />
            </div>
          )}
          <h1 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">
            Welcome{branding.platform_name !== "Adaptable" ? ` to ${branding.platform_name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Enter your class code to get started.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              First Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              maxLength={50}
              className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              placeholder="Your first name"
              autoFocus
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Class Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
              maxLength={8}
              className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 uppercase"
              placeholder="BOGG"
              autoComplete="off"
              onKeyDown={(e) => { if (e.key === "Enter" && code.trim() && name.trim()) handleJoin(); }}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleJoin}
            onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
            disabled={joining || !code.trim() || !name.trim()}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Student data is encrypted and never shared.
        </p>
      </div>
    </main>
  );
}
