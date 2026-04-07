"use client";

import { useState, useTransition } from "react";
import { verifyParentalConsent } from "@/lib/parental-consent";

export default function ConsentForm({ token }: { token: string }) {
  const [parentName, setParentName] = useState("");
  const [outcome, setOutcome] = useState<null | "granted" | "denied" | "error">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handle(grant: boolean) {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await verifyParentalConsent(
        token,
        grant ? "granted" : "denied",
        parentName || undefined
      );
      if (!result.ok) {
        setErrorMsg(result.error ?? "Something went wrong");
        setOutcome("error");
        return;
      }
      setOutcome(grant ? "granted" : "denied");
    });
  }

  if (outcome === "granted") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <h1 className="text-2xl font-bold text-green-900">Approved</h1>
        <p className="mt-3 text-sm text-green-800">
          Thank you. Your child can now use Adaptable. They&apos;ll receive an email letting them know.
        </p>
        <p className="mt-6 text-xs text-green-700">
          You can revoke this approval at any time by emailing privacy@adaptable.app.
        </p>
      </div>
    );
  }

  if (outcome === "denied") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Got it</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          We won&apos;t enable the account. The child cannot use Adaptable. If this was a mistake,
          they can sign up again.
        </p>
      </div>
    );
  }

  if (outcome === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-xl font-bold text-red-900">Link problem</h1>
        <p className="mt-3 text-sm text-red-800">{errorMsg}</p>
        <p className="mt-4 text-xs text-red-700">
          If you believe this is wrong, contact privacy@adaptable.app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
        Permission for Adaptable
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        A child under 13 has signed up for Adaptable, an AI-powered platform where students design
        and plan small businesses. Because of COPPA, we need your explicit permission before they can use it.
      </p>

      <div className="mt-6 space-y-4 rounded-xl bg-[var(--bg-subtle)] p-5 text-sm">
        <p className="font-semibold text-[var(--text-primary)]">What we collect from your child</p>
        <ul className="list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
          <li>First name and email (for login)</li>
          <li>Their answers to the Ikigai discovery</li>
          <li>Their conversations with our AI mentor</li>
          <li>Their progress through the program</li>
        </ul>
        <p className="font-semibold text-[var(--text-primary)] pt-2">We never collect</p>
        <ul className="list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
          <li>Phone number, home address, or social security number</li>
          <li>Financial information</li>
          <li>Anything we share with advertisers (we never sell student data)</li>
        </ul>
      </div>

      <div className="mt-6">
        <label htmlFor="parent_name" className="block text-sm font-medium text-[var(--text-primary)]">
          Your full name
        </label>
        <input
          id="parent_name"
          type="text"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          placeholder="Parent or guardian name"
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">Recorded as your consent attestation.</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => handle(true)}
          disabled={isPending || !parentName.trim()}
          className="flex-1 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          I approve
        </button>
        <button
          onClick={() => handle(false)}
          disabled={isPending}
          className="flex-1 rounded-lg border border-[var(--border-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-muted)] disabled:opacity-50"
        >
          I do not approve
        </button>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        By clicking &ldquo;I approve&rdquo;, you confirm you are the parent or guardian of this child
        and consent to Adaptable collecting and processing the data described above.
        You can revoke at any time by emailing privacy@adaptable.app.
      </p>
    </div>
  );
}
