"use client";

import { useState, useEffect, useTransition } from "react";
import { updateOrgEmailConfig, getOrgEmailConfig } from "./actions";

interface OrgEmailSettingsProps {
  orgId: string;
}

export default function OrgEmailSettings({ orgId }: OrgEmailSettingsProps) {
  const [senderEmail, setSenderEmail] = useState("");
  const [senderDomain, setSenderDomain] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getOrgEmailConfig(orgId).then((result) => {
      if ("error" in result) return;
      setSenderEmail(result.senderEmail ?? "");
      setSenderDomain(result.senderDomain ?? "");
      setLoaded(true);
    });
  }, [orgId]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrgEmailConfig(
        orgId,
        senderEmail.trim() || null,
        senderDomain.trim() || null
      );
      if (result.error) {
        setStatus(result.error);
      } else {
        setStatus("Saved");
      }
      setTimeout(() => setStatus(null), 3000);
    });
  }

  if (!loaded) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <p className="text-sm text-[var(--text-muted)]">Loading email settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
          Organization Email Settings
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Send crisis alerts and notifications from your own domain instead of the default Adaptable address.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-4">
        <div>
          <label
            htmlFor="sender-email"
            className="block text-sm font-semibold text-[var(--text-primary)]"
          >
            Sender Email
          </label>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            The &quot;from&quot; address on alert emails, e.g. alerts@yourorg.org
          </p>
          <input
            id="sender-email"
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="alerts@yourorg.org"
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
        </div>

        <div>
          <label
            htmlFor="sender-domain"
            className="block text-sm font-semibold text-[var(--text-primary)]"
          >
            Sender Domain
          </label>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            The domain you verified in Resend, e.g. yourorg.org
          </p>
          <input
            id="sender-domain"
            type="text"
            value={senderDomain}
            onChange={(e) => setSenderDomain(e.target.value)}
            placeholder="yourorg.org"
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
        </div>

        <div className="rounded-lg bg-[var(--bg-subtle)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">
            To send emails from your domain, add the DNS records from your Resend dashboard.
            Until configured, emails will be sent from the default Adaptable address.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          {status && (
            <p className={`text-xs ${status === "Saved" ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
