"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Guest join page for live events.
 * No signup, no email, no Google SSO.
 * Student enters a class code + first name → anonymous session → straight to onboarding.
 *
 * Requires Supabase anonymous sign-in to be enabled in the dashboard:
 * Authentication → Sign In / Up → Anonymous Sign-Ins → ON
 */
export default function GuestJoinPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) {
      setError("Enter both a class code and your first name.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Enter your full first name.");
      return;
    }

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
        setError("That code doesn't work. Check with your instructor.");
        setJoining(false);
        return;
      }

      if (inviteCode.current_uses >= inviteCode.max_uses) {
        setError("This class is full. Let your instructor know.");
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

      // 4. Create/update profile with name and org
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: trimmedName,
          role: "student",
          org_id: classData.org_id,
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
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            Adaptable
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Enter your class code to get started.
          </p>
        </div>

        <div className="space-y-4">
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
              placeholder="IGNITE"
              autoFocus
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Your First Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              maxLength={50}
              className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              placeholder="Your first name"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !code.trim() || !name.trim()}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          adaptable.one
        </p>
      </div>
    </main>
  );
}
