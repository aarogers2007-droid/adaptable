"use client";

import { useEffect, useRef, useState } from "react";
import { listOrgsForIngest, uploadCurriculumForOrg } from "./actions";

// Platform-owner drag-and-drop curriculum ingestion. Pick an org, drop
// PDF/DOCX/PPTX/TXT files, hit Ingest: uploads them, then streams the
// pipeline's progress from /api/curriculum/process.

type Org = { id: string; name: string; slug: string | null };
type Phase = "parse" | "chunk" | "embed" | "structure" | "lessons" | "complete" | "error" | "";

const ACCEPT = ".pdf,.docx,.pptx,.txt";

export default function IngestMenu() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("");
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ lessonCount: number; chunkCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listOrgsForIngest().then((r) => {
      if ("orgs" in r) setOrgs(r.orgs);
      else setError(r.error);
    });
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function ingest() {
    if (busy) return;
    setError(null);
    setResult(null);
    if (!orgId) return setError("Pick an organization first.");
    if (files.length === 0) return setError("Add at least one file.");

    setBusy(true);
    setPhase("");
    setPct(0);
    setMsg("Uploading files…");

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const up = await uploadCurriculumForOrg(orgId, fd);
      if ("error" in up) {
        setError(up.error);
        setBusy(false);
        return;
      }

      setMsg("Files uploaded. Starting pipeline…");
      const res = await fetch("/api/curriculum/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || "Could not start the pipeline.");
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.phase) setPhase(d.phase);
            if (typeof d.progress === "number") setPct(d.progress);
            if (d.message) setMsg(d.message);
            if (d.phase === "complete") {
              setResult({ lessonCount: d.lessonCount ?? 0, chunkCount: d.chunkCount ?? 0 });
            }
            if (d.phase === "error") setError(d.message || "Pipeline error.");
          } catch {
            // ignore malformed SSE line
          }
        }
      }
    } catch {
      setError("Connection dropped during ingestion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-4">
        Curriculum Ingestion
      </p>

      {/* Org picker */}
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Organization</label>
      <select
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        disabled={busy}
        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
      >
        <option value="">Select an org…</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}{o.slug ? ` (${o.slug})` : ""}
          </option>
        ))}
      </select>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border-strong)]"
        }`}
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Drag &amp; drop curriculum files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">PDF, DOCX, PPTX, or TXT — up to 20 files, 50MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-sm">
              <span className="truncate text-[var(--text-primary)]">{f.name}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                className="ml-3 shrink-0 text-[var(--text-muted)] hover:text-[var(--error)]"
                aria-label={`Remove ${f.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Progress */}
      {busy && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {phase ? `${phase}: ` : ""}{msg}
          </p>
        </div>
      )}

      {result && (
        <p className="mt-4 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-4 py-3 text-sm text-[var(--text-primary)]">
          Done. {result.chunkCount} chunks embedded, {result.lessonCount} draft lessons proposed.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}

      <button
        type="button"
        onClick={ingest}
        disabled={busy || !orgId || files.length === 0}
        className="mt-4 w-full rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Ingesting…" : "Ingest"}
      </button>
    </div>
  );
}
