"use client";

import { useState, useTransition } from "react";
import { createClass } from "./actions";

interface CreateClassModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const GRADES = [9, 10, 11, 12];

export default function CreateClassModal({ onClose, onCreated }: CreateClassModalProps) {
  const [name, setName] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleGrade(grade: number) {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  }

  function handleCreate() {
    if (!name.trim()) {
      setError("Class name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createClass(
        name.trim(),
        selectedGrades,
        description.trim() || undefined
      );
      if (result.error) {
        setError(result.error);
      } else {
        onCreated?.();
        onClose();
        // Force refresh to show new class
        window.location.reload();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
          Create a New Class
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          An invite code will be generated automatically.
        </p>

        <div className="mt-5 space-y-4">
          {/* Class name */}
          <div>
            <label
              htmlFor="class-name"
              className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Class name
            </label>
            <input
              id="class-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Entrepreneurship Period 3"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
            />
          </div>

          {/* Grade levels */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Grade levels
            </label>
            <div className="flex gap-2">
              {GRADES.map((grade) => (
                <button
                  key={grade}
                  onClick={() => toggleGrade(grade)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedGrades.includes(grade)
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="class-desc"
              className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Description <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              id="class-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this class..."
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create class"}
          </button>
        </div>
      </div>
    </div>
  );
}
