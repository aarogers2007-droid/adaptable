"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getOnboardingContext,
  checkSubdomainAvailability,
  provisionOrganization,
} from "./actions";

// ─── Types ───

interface FilePreview {
  file: File;
  url: string; // object URL for preview
}

// ─── Helpers ───

function toSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function validateFileUpload(file: File): string | null {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ["image/png", "image/svg+xml"];
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG and SVG files are allowed.";
  if (file.size > MAX_SIZE) return "File must be under 2MB.";
  return null;
}

// ─── Main Component ───

export default function OrgOnboardingPage() {
  const [step, setStep] = useState(1);

  // Step 1: Org details
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainAuto, setSubdomainAuto] = useState(true); // auto-derive from orgName
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Step 2: Branding
  const [logo, setLogo] = useState<FilePreview | null>(null);
  const [favicon, setFavicon] = useState<FilePreview | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [secondaryColor, setSecondaryColor] = useState("#C084FC");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Step 3: Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // ─── Prefill from profile ───
  useEffect(() => {
    getOnboardingContext().then((ctx) => {
      if (ctx.contactName) setContactName(ctx.contactName);
      if (ctx.contactEmail) setContactEmail(ctx.contactEmail);
    });
  }, []);

  // ─── Cleanup file URLs on unmount ───
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
      if (logo) URL.revokeObjectURL(logo.url);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (favicon) URL.revokeObjectURL(favicon.url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-derive subdomain from org name ───
  useEffect(() => {
    if (subdomainAuto && orgName.trim().length >= 2) {
      setSubdomain(toSubdomain(orgName));
    }
  }, [orgName, subdomainAuto]);

  // ─── Debounced subdomain availability check ───
  useEffect(() => {
    if (subdomain.length < 3) {
      setSubdomainAvailable(null);
      setSubdomainError(null);
      return;
    }

    setSubdomainChecking(true);
    setSubdomainAvailable(null);
    setSubdomainError(null);

    const timer = setTimeout(async () => {
      const result = await checkSubdomainAvailability(subdomain);
      setSubdomainAvailable(result.available);
      setSubdomainError(result.error ?? null);
      setSubdomainChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // ─── File handlers ───

  const handleFileSelect = useCallback(
    (type: "logo" | "favicon", file: File) => {
      const err = validateFileUpload(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      if (type === "logo") {
        if (logo) URL.revokeObjectURL(logo.url);
        setLogo({ file, url });
      } else {
        if (favicon) URL.revokeObjectURL(favicon.url);
        setFavicon({ file, url });
      }
    },
    [logo, favicon]
  );

  const handleDrop = useCallback(
    (type: "logo" | "favicon") => (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(type, file);
    },
    [handleFileSelect]
  );

  // ─── Submit ───

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("orgName", orgName.trim());
    formData.set("subdomain", subdomain);
    formData.set("contactName", contactName.trim());
    formData.set("contactEmail", contactEmail.trim());
    formData.set("primaryColor", primaryColor);
    formData.set("secondaryColor", secondaryColor);
    formData.set("welcomeMessage", welcomeMessage.trim());
    if (logo) formData.set("logo", logo.file);
    if (favicon) formData.set("favicon", favicon.file);

    const result = await provisionOrganization(formData);

    if (result?.error) {
      setError(result.error);
      if (result.goToStep) setStep(result.goToStep);
      setSubmitting(false);
    }
    // On success, provisionOrganization calls redirect() — we don't reach here
  }

  // ─── Step validation ───

  const step1Valid =
    orgName.trim().length >= 2 &&
    subdomain.length >= 3 &&
    subdomainAvailable === true;

  const stepLabels = ["Details", "Branding", "Confirm"];

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-2 mb-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className="h-1.5 rounded-full transition-colors"
                style={{ background: step >= i + 1 ? "var(--primary)" : "var(--border)" }}
              />
              <p className="mt-1 text-[10px] text-center text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════ */}
        {/* STEP 1: Organization Details        */}
        {/* ═══════════════════════════════════ */}
        {step === 1 && (
          <div className="mt-6">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Create Your Organization
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Set up your school or program on Adaptable.
            </p>

            <div className="mt-6 space-y-4">
              {/* Org name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value.slice(0, 100))}
                  maxLength={100}
                  className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="e.g., Riverside Academy"
                  autoFocus
                />
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => {
                      setSubdomainAuto(false);
                      setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32));
                    }}
                    maxLength={32}
                    className="flex-1 rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 font-mono"
                    placeholder="riverside"
                  />
                  <span className="text-sm text-[var(--text-muted)] shrink-0">.adaptable.one</span>
                </div>

                {/* Availability indicator */}
                {subdomain.length >= 3 && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {subdomainChecking ? (
                      <span className="text-xs text-[var(--text-muted)]">Checking...</span>
                    ) : subdomainAvailable === true ? (
                      <span className="text-xs text-green-600 font-medium">Available</span>
                    ) : subdomainAvailable === false ? (
                      <span className="text-xs text-[var(--error)] font-medium">
                        {subdomainError || "Not available"}
                      </span>
                    ) : null}
                  </div>
                )}

                {subdomain.length >= 3 && subdomainAvailable && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Your URL: <span className="font-mono font-medium text-[var(--text-secondary)]">{subdomain}.adaptable.one</span>
                  </p>
                )}
              </div>

              {/* Contact name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value.slice(0, 100))}
                  maxLength={100}
                  className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="Your name"
                />
              </div>

              {/* Contact email */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="admin@school.edu"
                />
              </div>
            </div>

            {error && step === 1 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => { setError(null); setStep(2); }}
              disabled={!step1Valid}
              className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              Next — Branding
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 2: Branding Assets             */}
        {/* ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="mt-6">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Brand Your Platform
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Upload your logo and pick your colors. You can always change these later.
            </p>

            <div className="mt-6 space-y-5">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Logo <span className="text-[var(--text-muted)] font-normal">(PNG or SVG, max 2MB)</span>
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop("logo")}
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-8 cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                >
                  {logo ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.url} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{logo.file.name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(logo.url); setLogo(null); }}
                          className="text-xs text-[var(--error)] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">
                      Drop your logo here, or <span className="text-[var(--primary)] font-medium">browse</span>
                    </p>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileSelect("logo", e.target.files[0]); }}
                />
              </div>

              {/* Favicon upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Favicon <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop("favicon")}
                  onClick={() => faviconInputRef.current?.click()}
                  className="flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-6 cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                >
                  {favicon ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={favicon.url} alt="Favicon preview" className="h-8 w-8 object-contain rounded" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{favicon.file.name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(favicon.url); setFavicon(null); }}
                          className="text-xs text-[var(--error)] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">
                      Drop your favicon here, or <span className="text-[var(--primary)] font-medium">browse</span>
                    </p>
                  )}
                </div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileSelect("favicon", e.target.files[0]); }}
                />
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--border)] p-0.5"
                    />
                    <span className="font-mono text-sm text-[var(--text-secondary)]">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--border)] p-0.5"
                    />
                    <span className="font-mono text-sm text-[var(--text-secondary)]">{secondaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Welcome message */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Welcome Message <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 resize-none"
                  placeholder="Welcome to our entrepreneurship program!"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)] text-right">{welcomeMessage.length}/200</p>
              </div>

              {/* Live preview */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Preview</label>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  {/* Mini nav bar */}
                  <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: primaryColor }}>
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo.url} alt="" className="h-6 w-6 object-contain rounded" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-white/20" />
                    )}
                    <span className="text-sm font-semibold text-white">{orgName || "Your Org"}</span>
                  </div>
                  {/* Mini content */}
                  <div className="bg-white px-4 py-4">
                    <div className="h-2 w-32 rounded bg-gray-200" />
                    <div className="mt-2 h-2 w-48 rounded bg-gray-100" />
                    <button
                      type="button"
                      className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: secondaryColor }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && step === 2 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setStep(3); }}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
              >
                Next — Review
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 3: Review & Confirm            */}
        {/* ═══════════════════════════════════ */}
        {step === 3 && (
          <div className="mt-6">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Review &amp; Confirm
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Everything look good? You can always update these in settings later.
            </p>

            <div className="mt-6 space-y-4">
              {/* Org details summary */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Organization</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{orgName}</p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-[var(--primary)] hover:underline">Edit</button>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">URL</p>
                  <p className="text-sm font-mono text-[var(--text-primary)]">{subdomain}.adaptable.one</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Contact</p>
                    <p className="text-sm text-[var(--text-primary)]">{contactName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Email</p>
                    <p className="text-sm text-[var(--text-primary)]">{contactEmail || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Branding summary */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <p className="text-xs text-[var(--text-muted)]">Branding</p>
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-[var(--primary)] hover:underline">Edit</button>
                </div>
                <div className="flex items-center gap-4">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo.url} alt="Logo" className="h-10 w-10 object-contain rounded border border-[var(--border)]" />
                  ) : (
                    <div className="h-10 w-10 rounded border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] text-xs">
                      No logo
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full border border-[var(--border)]" style={{ background: primaryColor }} title={`Primary: ${primaryColor}`} />
                    <div className="h-8 w-8 rounded-full border border-[var(--border)]" style={{ background: secondaryColor }} title={`Secondary: ${secondaryColor}`} />
                  </div>
                </div>
                {welcomeMessage && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Welcome Message</p>
                    <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{welcomeMessage}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {submitting ? "Creating organization..." : "Create Organization"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
