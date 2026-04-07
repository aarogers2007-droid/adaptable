"use client";

import { useState, useTransition } from "react";
import { setStreaksEnabled, setVoiceEnabled, exportGradebookCSV } from "./actions";

interface ClassSettingsProps {
  classId: string;
  className: string;
  initialStreaksEnabled: boolean;
  initialVoiceEnabled: boolean;
}

export default function ClassSettings({ classId, className, initialStreaksEnabled, initialVoiceEnabled }: ClassSettingsProps) {
  const [streaksEnabled, setStreaksEnabledState] = useState(initialStreaksEnabled);
  const [voiceEnabled, setVoiceEnabledState] = useState(initialVoiceEnabled);
  const [isPending, startTransition] = useTransition();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  function handleStreaksToggle() {
    const next = !streaksEnabled;
    setStreaksEnabledState(next); // Optimistic
    startTransition(async () => {
      const result = await setStreaksEnabled(classId, next);
      if (result.error) {
        setStreaksEnabledState(!next); // Revert
      }
    });
  }

  function handleVoiceToggle() {
    const next = !voiceEnabled;
    setVoiceEnabledState(next); // Optimistic
    startTransition(async () => {
      const result = await setVoiceEnabled(classId, next);
      if (result.error) {
        setVoiceEnabledState(!next); // Revert
      }
    });
  }

  async function handleExport() {
    setExportStatus("Generating...");
    const result = await exportGradebookCSV(classId);
    if (result.error || !result.csv) {
      setExportStatus(result.error ?? "Export failed");
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }
    // Trigger browser download
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeClassName = className.replace(/[^a-z0-9]/gi, "_");
    const date = new Date().toISOString().split("T")[0];
    link.download = `${safeClassName}_gradebook_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportStatus("Downloaded ✓");
    setTimeout(() => setExportStatus(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
          Class Settings
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Configure how your students experience Adaptable.
        </p>
      </div>

      {/* Gradebook Export */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Gradebook Export</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Download a CSV with every student&apos;s progress, business idea, decisions, and pitch.
              Importable into Google Classroom, Canvas, or any spreadsheet.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-light)] transition-colors whitespace-nowrap"
          >
            Download CSV
          </button>
        </div>
        {exportStatus && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">{exportStatus}</p>
        )}
      </div>

      {/* Streaks Toggle */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Streak Tracking</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Show students a fire emoji and day-streak count when they check in daily.
              Some communities prefer to disable streak gamification — turn this off if your families would object.
            </p>
          </div>
          <button
            onClick={handleStreaksToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              streaksEnabled ? "bg-[var(--primary)]" : "bg-[var(--bg-muted)]"
            }`}
            aria-label="Toggle streaks"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                streaksEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Currently: <strong className="text-[var(--text-primary)]">{streaksEnabled ? "Enabled" : "Disabled"}</strong>
        </p>
      </div>

      {/* Voice Input Toggle */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Microphone / Voice Input</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Allow students to dictate their answers using the device microphone.
              Disable this if your district restricts microphone use on student Chromebooks
              or if classroom audio would be disruptive.
            </p>
          </div>
          <button
            onClick={handleVoiceToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              voiceEnabled ? "bg-[var(--primary)]" : "bg-[var(--bg-muted)]"
            }`}
            aria-label="Toggle voice input"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                voiceEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Currently: <strong className="text-[var(--text-primary)]">{voiceEnabled ? "Enabled" : "Disabled"}</strong>
        </p>
      </div>
    </div>
  );
}
