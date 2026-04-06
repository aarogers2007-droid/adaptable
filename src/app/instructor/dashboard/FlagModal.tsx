"use client";

import { useState } from "react";
import { createFlag } from "./agency-actions";

interface FlagModalProps {
  studentId: string;
  studentName: string;
  classId: string;
  onClose: () => void;
  onCreated?: () => void;
}

export default function FlagModal({
  studentId,
  studentName,
  classId,
  onClose,
  onCreated,
}: FlagModalProps) {
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await createFlag(studentId, classId, priority, note, dueDate || undefined);
    setSaving(false);
    if (!result.error) {
      onCreated?.();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
          Flag {studentName} for Follow-up
        </h3>

        {/* Priority */}
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Priority</p>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  priority === p
                    ? p === "high"
                      ? "bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30"
                      : p === "medium"
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30"
                        : "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)]"
                    : "border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Note</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What do you want to follow up on?"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          />
        </div>

        {/* Due date */}
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Due date (optional)</p>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Flag"}
          </button>
        </div>
      </div>
    </div>
  );
}
