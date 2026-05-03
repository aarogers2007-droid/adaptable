"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { generateStudentCard } from "@/app/(app)/invention/card-actions";
import type { DashboardData } from "./InventionDashboard";

// ── Group colors ──

const GROUP_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

function getGroupColor(groupNumber: number | null): string | null {
  if (!groupNumber) return null;
  return GROUP_COLORS[(groupNumber - 1) % GROUP_COLORS.length];
}

// ── Types ──

type CardSession = DashboardData["cardSessions"][number];
type SortMode = "name" | "group" | "recent";

const INSIGHT_LABELS = [
  { key: "wish", label: "THE WISH" },
  { key: "mind", label: "THE MIND" },
  { key: "lens", label: "THE LENS" },
  { key: "scale", label: "THE SCALE" },
  { key: "voice", label: "THE VOICE" },
] as const;

// ── Props ──

interface Props {
  cardSessions: CardSession[];
  classCode: string;
  isPlatformOwner: boolean;
  onRefresh: () => Promise<void>;
}

export default function AdminCardsTab({ cardSessions, classCode, isPlatformOwner, onRefresh }: Props) {
  const [sessions, setSessions] = useState(cardSessions);
  const [sort, setSort] = useState<SortMode>("name");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState({ done: 0, total: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync from parent props
  useEffect(() => {
    setSessions(cardSessions);
    setLastUpdated(new Date());
  }, [cardSessions]);

  // ── Sorting ──

  const sorted = [...sessions].sort((a, b) => {
    if (sort === "name") {
      const aLast = a.studentName.split(" ").pop() ?? "";
      const bLast = b.studentName.split(" ").pop() ?? "";
      return aLast.localeCompare(bLast);
    }
    if (sort === "group") {
      return (a.groupNumber ?? 999) - (b.groupNumber ?? 999);
    }
    // recent
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

  const completedWithCard = sorted.filter((s) => s.generatedCard);
  const completedCards = sorted.filter((s) => s.generatedCard);

  // ── Stats ──
  const cardCount = sessions.filter((s) => s.generatedCard).length;
  const pendingCount = sessions.filter((s) => s.allCirclesDone && !s.generatedCard).length;
  const notStartedCount = sessions.filter((s) => !s.allCirclesDone).length;

  // ── Generate single card ──

  const handleGenerate = useCallback(async (sessionId: string) => {
    setGeneratingIds((prev) => new Set(prev).add(sessionId));
    try {
      const result = await generateStudentCard(sessionId);
      if (result.card) {
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sessionId
              ? { ...s, generatedCard: result.card as CardSession["generatedCard"] }
              : s
          )
        );
      }
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  }, []);

  // ── Backfill ──

  const handleBackfill = useCallback(async () => {
    const pending = sessions.filter((s) => s.allCirclesDone && !s.generatedCard);
    if (pending.length === 0) return;
    setBackfilling(true);
    setBackfillProgress({ done: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      await handleGenerate(pending[i].sessionId);
      setBackfillProgress({ done: i + 1, total: pending.length });
      if (i < pending.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setBackfilling(false);
    await onRefresh();
  }, [sessions, handleGenerate, onRefresh]);

  // ── Modal keyboard ──

  useEffect(() => {
    if (modalIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setModalIndex(null); return; }
      if (e.key === "ArrowLeft") {
        setModalIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      }
      if (e.key === "ArrowRight") {
        setModalIndex((i) => (i !== null && i < completedWithCard.length - 1 ? i + 1 : i));
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [modalIndex, completedWithCard.length]);

  // Focus trap
  useEffect(() => {
    if (modalIndex !== null) {
      modalRef.current?.focus();
    }
  }, [modalIndex]);

  // ── Copy share link ──
  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Print all ──
  const handlePrintAll = () => {
    window.open(`/instructor/invention/${classCode}/print/cards`, "_blank");
  };

  // ── Modal card ──
  const modalCard = modalIndex !== null ? completedCards[modalIndex] : null;

  return (
    <div className="mt-6">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">{cardCount}</span> cards generated
          {" · "}
          <span className="font-semibold text-[var(--text-primary)]">{pendingCount}</span> pending
          {" · "}
          <span className="font-semibold text-[var(--text-primary)]">{notStartedCount}</span> not started
        </p>
        <div className="flex items-center gap-2">
          {isPlatformOwner && pendingCount > 0 && (
            <button
              type="button"
              onClick={handleBackfill}
              disabled={backfilling}
              className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
            >
              {backfilling ? `Generating ${backfillProgress.done}/${backfillProgress.total}...` : `Generate All (${pendingCount})`}
            </button>
          )}
          {cardCount > 0 && (
            <button
              type="button"
              onClick={handlePrintAll}
              className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
            >
              Print All Cards
            </button>
          )}
        </div>
      </div>

      {/* Backfill progress bar */}
      {backfilling && (
        <div className="mb-4 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${backfillProgress.total > 0 ? (backfillProgress.done / backfillProgress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-[var(--text-muted)]">Sorted by:</span>
        {(["name", "group", "recent"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              sort === s
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
            }`}
          >
            {s === "name" ? "Last Name" : s === "group" ? "Group" : "Most Recent"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((session) => {
          const color = getGroupColor(session.groupNumber);
          const hasCard = !!session.generatedCard;
          const readyToGenerate = session.allCirclesDone && !hasCard;
          const isGenerating = generatingIds.has(session.sessionId);
          const firstName = session.studentName.split(" ")[0];

          const circlesDone = [session.completed].filter(Boolean).length > 0
            ? 5 // If completed, all 5 done
            : (session.allCirclesDone ? 5 : 0); // simplified

          return (
            <div
              key={session.sessionId}
              role="button"
              tabIndex={hasCard ? 0 : -1}
              aria-label={hasCard ? `${session.studentName}, ${session.generatedCard!.title}` : `${session.studentName}, card not generated`}
              onClick={() => {
                if (hasCard) {
                  const idx = completedCards.findIndex((c) => c.sessionId === session.sessionId);
                  if (idx >= 0) setModalIndex(idx);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && hasCard) {
                  const idx = completedCards.findIndex((c) => c.sessionId === session.sessionId);
                  if (idx >= 0) setModalIndex(idx);
                }
              }}
              className={`relative rounded-xl p-4 transition-all ${hasCard ? "cursor-pointer hover:shadow-md" : ""}`}
              style={{
                border: color ? `2px solid ${color}` : "1px solid #E5E5E5",
                background: color ? `${color}0F` : "#fff", // 0F = ~6% opacity
              }}
            >
              {/* Group pill */}
              {session.groupNumber && color && (
                <div
                  className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: color }}
                >
                  Group {session.groupNumber}
                </div>
              )}

              {/* Student name */}
              <p className="text-xs text-[var(--text-muted)] mb-1">{firstName}</p>

              {hasCard ? (
                <>
                  <p className="font-[family-name:var(--font-serif)] text-lg font-bold text-[var(--text-primary)]">
                    {session.generatedCard!.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    {INSIGHT_LABELS.map((ins) => (
                      <p key={ins.key} className="text-[11px] text-[var(--text-secondary)] leading-tight">
                        {session.generatedCard!.insights[ins.key as keyof (typeof session.generatedCard & object)["insights"]]}
                      </p>
                    ))}
                  </div>
                </>
              ) : readyToGenerate ? (
                <div className="mt-1">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    Ready to generate
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleGenerate(session.sessionId); }}
                    disabled={isGenerating}
                    className="mt-2 block rounded border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="text-xs italic text-[#999]">Not yet completed</p>
                  <p className="text-[10px] text-[#bbb] mt-0.5">
                    {circlesDone} of 5 complete
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Last updated */}
      <p className="mt-3 text-[10px] text-[var(--text-muted)]">
        Last updated {lastUpdated.toLocaleTimeString()}
      </p>

      {/* ── Modal ── */}
      {modalCard && modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Card for ${modalCard.studentName}`}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="relative mx-4 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-[var(--bg)] p-6 shadow-xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold text-[var(--text-primary)]">{modalCard.studentName}</p>
                {modalCard.groupNumber && (
                  <span
                    className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ background: getGroupColor(modalCard.groupNumber) ?? "#999" }}
                  >
                    Group {modalCard.groupNumber}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalIndex(null)}
                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setModalIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
                disabled={modalIndex === 0}
                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-30"
                aria-label="Previous card"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
                Showing card {modalIndex + 1} of {completedCards.length}
              </p>
              <button
                type="button"
                onClick={() => setModalIndex((i) => (i !== null && i < completedCards.length - 1 ? i + 1 : i))}
                disabled={modalIndex === completedCards.length - 1}
                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-30"
                aria-label="Next card"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            {/* Card render */}
            {modalCard.generatedCard && (
              <div className="rounded-xl p-8" style={{ background: "#FAFAF8", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <p style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.2em" }}>THE</p>
                <h2 className="font-[family-name:var(--font-serif)] mt-1" style={{ fontSize: "34px", fontWeight: 700, color: "#111" }}>
                  {modalCard.generatedCard.title.replace(/^The\s+/i, "")}
                </h2>
                <p className="mt-4" style={{ fontSize: "14px", fontWeight: 500, color: "#444", lineHeight: 1.6 }}>
                  {modalCard.generatedCard.description}
                </p>
                <div style={{ height: "1px", background: "#E5E5E5", margin: "20px 0" }} />
                <div className="space-y-3">
                  {INSIGHT_LABELS.map((ins) => (
                    <div key={ins.key} className="flex items-start gap-4">
                      <span style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.12em", width: "90px", flexShrink: 0, paddingTop: "3px" }}>
                        {ins.label}
                      </span>
                      <span style={{ fontSize: "13px", color: "#222", lineHeight: 1.5 }}>
                        {modalCard.generatedCard!.insights[ins.key as keyof typeof modalCard.generatedCard.insights]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (modalCard.generatedCard?.shareable_slug) {
                    const titleSlug = modalCard.generatedCard.title.replace(/^The\s+/i, "").toLowerCase();
                    const nameSlug = modalCard.studentName.split(" ")[0].toLowerCase();
                    window.open(`/invention/card-print?session=${modalCard.sessionId}&filename=${nameSlug}-${titleSlug}.pdf`, "_blank");
                  }
                }}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modalCard.generatedCard?.shareable_slug) {
                    handleCopyLink(modalCard.generatedCard.shareable_slug);
                  }
                }}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {copied ? "Link copied!" : "Copy Share Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
