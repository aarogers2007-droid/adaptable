"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface MirrorModalProps {
  mirrorPrompt: string;
  triggerType: "lesson_completion" | "return_from_absence" | "weekly_review";
  lessonId?: number;
  emotionalSnapshot?: string;
  daysAbsent?: number;
  onClose: () => void;
}

export default function MirrorModal({
  mirrorPrompt,
  triggerType,
  lessonId,
  emotionalSnapshot,
  daysAbsent,
  onClose,
}: MirrorModalProps) {
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const openedAtRef = useRef<number>(Date.now());

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-focus textarea after entrance
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => textareaRef.current?.focus(), 450);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const saveEntry = useCallback(
    async (studentResponse: string | null) => {
      setSaving(true);
      setError(false);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error: insertError } = await supabase
          .from("founder_log_entries")
          .insert({
            student_id: user.id,
            trigger_type: triggerType,
            lesson_id: lessonId ?? null,
            mirror_prompt: mirrorPrompt,
            student_response: studentResponse,
            emotional_snapshot: emotionalSnapshot ?? null,
            days_since_last_activity: daysAbsent ?? null,
            time_to_respond_ms: studentResponse ? Date.now() - openedAtRef.current : null,
          });

        if (insertError) throw insertError;

        setSaving(false); // BUG FIX #2: reset saving state on success
        if (studentResponse) {
          setSaved(true);
          setTimeout(() => {
            setVisible(false);
            setTimeout(() => { try { onClose(); } catch {} }, 300);
          }, 1000);
        } else {
          setVisible(false);
          setTimeout(() => { try { onClose(); } catch {} }, 300);
        }
      } catch {
        // BUG FIX #3: if dismiss (null response) fails, close anyway.
        // The modal must never trap the student.
        if (!studentResponse) {
          setVisible(false);
          setTimeout(() => { try { onClose(); } catch {} }, 300);
        } else {
          setError(true);
          setSaving(false);
        }
      }
    },
    [triggerType, lessonId, mirrorPrompt, emotionalSnapshot, daysAbsent, onClose]
  );

  // BUG FIX #1: memoize dismiss so the Escape handler always has a fresh reference
  const handleDismiss = useCallback(() => {
    saveEntry(null);
  }, [saveEntry]);

  function handleSave() {
    saveEntry(response.trim() || null);
  }

  // Escape key = dismiss (with correct dependency)
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") handleDismiss();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleDismiss]);

  return (
    <>
      {/* Backdrop: dark with subtle blur */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300
          ${visible ? "bg-[rgba(17,24,39,0.4)] backdrop-blur-[2px]" : "bg-transparent"}`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Centered card dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          role="dialog"
          aria-label="Founder's Mirror reflection"
          aria-modal="true"
          className={`pointer-events-auto w-full max-w-[480px] bg-white rounded-xl overflow-hidden
            transition-all duration-400
            ${visible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-[0.97] translate-y-2"}`}
          style={{
            boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Teal header band */}
          <div className="bg-[#F0FDFA] border-b border-[#CCFBF1] px-7 pt-6 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0D9488] mb-4 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              Founder&apos;s Mirror
            </p>
            <p className="font-[family-name:var(--font-display)] text-[20px] font-normal leading-[1.6] text-[#111827] tracking-[-0.01em]">
              {mirrorPrompt}
            </p>
          </div>

          {/* Body */}
          <div className="px-7 pt-6 pb-7">
            {/* Privacy signal */}
            <div className="flex items-center gap-1.5 mb-5 text-[13px] text-[#9CA3AF]">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="opacity-60 shrink-0" aria-hidden="true">
                <path d="M4 7V5a4 4 0 118 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1zm2 0h4V5a2 2 0 10-4 0v2z" />
              </svg>
              <span>Private to you. No one else sees this.</span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write honestly. No one's grading this."
              disabled={saving || saved}
              aria-label="Your reflection"
              className="w-full min-h-[130px] p-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]
                text-[16px] leading-[1.65] text-[#111827] placeholder:text-[#D1D5DB]
                focus:outline-none focus:border-[#0D9488] focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,148,136,0.08)]
                resize-none transition-all duration-200 disabled:opacity-60"
            />

            {/* Error */}
            {error && (
              <p className="mt-3 text-sm text-[#DC2626]">
                Couldn&apos;t save.{" "}
                <button onClick={handleSave} className="underline">Try again?</button>
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={handleDismiss}
                disabled={saving || saved}
                className="text-[14px] text-[#9CA3AF] hover:text-[#4B5563]
                  min-h-[44px] min-w-[44px] px-1 transition-colors
                  focus-visible:outline-2 focus-visible:outline-[#0D9488] focus-visible:outline-offset-2 focus-visible:rounded"
              >
                Not right now
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="min-h-[44px] px-7 rounded-lg bg-[#0D9488] text-white text-[14px] font-medium
                  hover:bg-[#14B8A6] active:bg-[#0F766E] disabled:opacity-60
                  transition-colors focus-visible:outline-2 focus-visible:outline-[#0D9488] focus-visible:outline-offset-2"
              >
                {saved ? "Saved" : saving ? "Saving..." : "Save this"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
