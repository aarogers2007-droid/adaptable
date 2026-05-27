"use client";

import { useState, useRef, useCallback } from "react";
import { saveBranding } from "./actions";

function validateFileUpload(file: File): string | null {
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/png", "image/svg+xml", "image/jpeg"];
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG, JPG, or SVG files are allowed.";
  if (file.size > MAX_SIZE) return "File must be under 2MB.";
  return null;
}

interface Step3Props {
  orgId: string;
  orgName: string;
  onComplete: () => void;
  onBack: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export default function Step3Brand({ orgId, orgName, onComplete, onBack, error, setError }: Step3Props) {
  const [logo, setLogo] = useState<{ file: File; url: string } | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [secondaryColor, setSecondaryColor] = useState("#F59E0B");
  const [submitting, setSubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    const err = validateFileUpload(file);
    if (err) { setError(err); return; }
    setError(null);
    const url = URL.createObjectURL(file);
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo({ file, url });
  }, [logo, setError]);

  async function handleSubmit() {
    setError(null); setSubmitting(true);
    const formData = new FormData();
    formData.set("primaryColor", primaryColor);
    formData.set("secondaryColor", secondaryColor);
    if (logo) formData.set("logo", logo.file);
    const result = await saveBranding(orgId, formData);
    if ("error" in result) { setError(result.error); setSubmitting(false); return; }
    onComplete();
  }

  return (
    <div className="max-w-xl mx-auto step-enter">
      <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
        Make it yours
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Add your logo and colors. Students will see your brand, not ours.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Logo</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-8 cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
            >
              {logo ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.url} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{logo.file.name}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(logo.url); setLogo(null); }} className="text-xs text-[var(--error)] hover:underline">Remove</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  Drop your logo here, or <span className="text-[var(--primary)] font-medium">browse</span>
                </p>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">PNG, JPG, or SVG, max 2MB</p>
          </div>

          {/* Primary color */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-11 w-11 cursor-pointer rounded-xl border border-[var(--border)] p-0 overflow-hidden" />
              <input type="text" value={primaryColor} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value); }} maxLength={7} className="w-24 font-mono text-sm rounded-lg border border-[var(--border-strong)] px-3 py-2 outline-none focus:border-[var(--primary)]" />
            </div>
          </div>

          {/* Secondary color */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-11 w-11 cursor-pointer rounded-xl border border-[var(--border)] p-0 overflow-hidden" />
              <input type="text" value={secondaryColor} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setSecondaryColor(e.target.value); }} maxLength={7} className="w-24 font-mono text-sm rounded-lg border border-[var(--border-strong)] px-3 py-2 outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Preview</label>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: primaryColor }}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.url} alt="" className="h-6 w-6 object-contain rounded" />
              ) : (
                <div className="h-6 w-6 rounded bg-white/20" />
              )}
              <span className="text-sm font-semibold text-white truncate">{orgName || "Your Organization"}</span>
              <div className="ml-auto flex gap-3">
                {["Lessons", "Scenarios", "Guide"].map((item) => (
                  <span key={item} className="text-xs text-white/70 hidden sm:inline">{item}</span>
                ))}
              </div>
            </div>
            <div className="bg-white px-4 py-5">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo.url} alt="" className="h-5 w-5 object-contain rounded" />
                  ) : (
                    <div className="h-5 w-5 rounded bg-gray-200" />
                  )}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{orgName || "Your Organization"}</span>
                </div>
                <div className="h-2 w-32 rounded bg-gray-200" />
                <div className="mt-2 h-2 w-48 rounded bg-gray-100" />
                <button type="button" className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium text-white" style={{ background: secondaryColor }}>Start Lesson</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">{error}</div>
      )}

      <div className="mt-8 flex gap-3">
        <button type="button" onClick={onBack} className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors" style={{ minHeight: 44 }}>Back</button>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50" style={{ minHeight: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          {submitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
