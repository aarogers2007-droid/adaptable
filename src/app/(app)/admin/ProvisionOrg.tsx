"use client";

import { useState } from "react";
import { provisionOrganizationManual } from "./actions";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export default function ProvisionOrg() {
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAuto, setSlugAuto] = useState(true);
  const [subdomain, setSubdomain] = useState("");
  const [subdomainAuto, setSubdomainAuto] = useState(true);
  const [tier, setTier] = useState("starter");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; orgId?: string; error?: string } | null>(null);

  // Auto-derive slug and subdomain from org name
  const handleNameChange = (name: string) => {
    setOrgName(name);
    const derived = toSlug(name);
    if (slugAuto) setSlug(derived);
    if (subdomainAuto) setSubdomain(derived);
  };

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    const res = await provisionOrganizationManual({
      orgName: orgName.trim(),
      slug,
      subdomain,
      subscriptionTier: tier,
      contactEmail: contactEmail.trim(),
    });

    setResult(res);
    setSubmitting(false);

    if (res.success) {
      setOrgName("");
      setSlug("");
      setSubdomain("");
      setContactEmail("");
      setSlugAuto(true);
      setSubdomainAuto(true);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => handleNameChange(e.target.value.slice(0, 100))}
            className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="e.g., Riverside Academy"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlugAuto(false); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32)); }}
            className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--primary)]"
            placeholder="riverside"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Subdomain</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => { setSubdomainAuto(false); setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32)); }}
              className="flex-1 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--primary)]"
              placeholder="riverside"
            />
            <span className="text-xs text-[var(--text-muted)]">.adaptable.one</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Subscription Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          >
            <option value="starter">Starter</option>
            <option value="standard">Standard</option>
            <option value="enterprise">Enterprise</option>
            <option value="internal">Internal</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Primary Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            placeholder="admin@school.edu (will be assigned org_admin role if account exists)"
          />
        </div>
      </div>

      {result && (
        <div className={`rounded-lg px-3 py-2 text-sm ${
          result.success
            ? "border border-green-200 bg-green-50 text-green-700"
            : "border border-[var(--error)]/20 bg-[var(--error)]/5 text-[var(--error)]"
        }`}>
          {result.success
            ? `Organization created (ID: ${result.orgId?.slice(0, 8)}...)`
            : result.error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !orgName.trim() || !slug || !subdomain}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
      >
        {submitting ? "Provisioning..." : "Provision Organization"}
      </button>
    </div>
  );
}
