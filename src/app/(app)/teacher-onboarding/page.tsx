"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAvailableCode, createTeacherClass } from "./actions";

const GRADE_LEVELS = [
  { id: "k2", label: "Elementary (K-2)" },
  { id: "35", label: "Elementary (3-5)" },
  { id: "68", label: "Middle School (6-8)" },
  { id: "912", label: "High School (9-12)" },
];

export default function TeacherOnboardingPage() {
  const [step, setStep] = useState(1);
  const [gradeLevel, setGradeLevel] = useState("");
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  // Auto-generate code when class name changes
  useEffect(() => {
    if (className.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets dependent state when input is too short
      setClassCode("");
      return;
    }
    const timer = setTimeout(async () => {
      setCodeLoading(true);
      const code = await getAvailableCode(className);
      setClassCode(code);
      setCodeLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [className]);

  async function handleCreate() {
    if (!gradeLevel || !className.trim() || !classCode) return;
    setCreating(true);
    setError(null);

    const result = await createTeacherClass({
      className: className.trim(),
      gradeLevel,
      classCode,
    });

    if (result.error) {
      setError(result.error);
      setCreating(false);
      return;
    }

    router.push("/instructor/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className="h-1.5 flex-1 rounded-full" style={{ background: "#0D9488" }} />
          <div className="h-1.5 flex-1 rounded-full" style={{ background: step >= 2 ? "#0D9488" : "#E5E7EB" }} />
        </div>

        {step === 1 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              What grade level is your class?
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This helps us adapt the curriculum to your students.
            </p>

            <div className="mt-6 space-y-3">
              {GRADE_LEVELS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGradeLevel(g.id)}
                  className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                    gradeLevel === g.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--text-primary)] ring-2 ring-[var(--primary)]/20"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!gradeLevel}
              className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Give your class a name
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This is what students will see when they join.
            </p>

            <div className="mt-6">
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value.slice(0, 50))}
                maxLength={50}
                className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                placeholder="e.g., Ms. Davis — Period 3"
                autoFocus
              />
            </div>

            {classCode && (
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
                <p className="text-xs text-[var(--text-muted)]">Your class code will be</p>
                <p className="mt-1 font-mono text-lg font-bold text-[var(--primary)] tracking-wider">
                  {codeLoading ? "..." : classCode}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Share this with your students so they can join.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">{error}</div>
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
                onClick={handleCreate}
                disabled={!className.trim() || !classCode || creating}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {creating ? "Creating class..." : "Create Class"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
