"use client";

import { useState, useEffect } from "react";
import { getStudentProfile } from "./profile-actions";
import type { StudentProfileData } from "./profile-actions";

const TIER_COLORS: Record<string, string> = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)",
};

interface StudentProfileProps {
  studentId: string;
  onClose: () => void;
}

export default function StudentProfile({
  studentId,
  onClose,
}: StudentProfileProps) {
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStudentProfile(studentId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          </div>
        ) : !data ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">
            Could not load profile.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                {data.displayName}
              </h3>
              {data.businessName && (
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {data.businessName}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Achievements
              </p>
              {data.achievements.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  No badges yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.achievements.map((a) => {
                    const color = TIER_COLORS[a.tier] ?? TIER_COLORS.gold;
                    return (
                      <div
                        key={`${a.id}-${a.tier}`}
                        className="flex items-center justify-center w-9 h-9 rounded-lg text-lg"
                        style={{
                          backgroundColor: `${color}14`,
                          border: `1.5px solid ${color}40`,
                        }}
                        title={`${a.name} (${a.tier})`}
                      >
                        {a.icon}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
