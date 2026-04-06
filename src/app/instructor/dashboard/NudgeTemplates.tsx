"use client";

import { useState } from "react";
import { sendNudge } from "./agency-actions";

function getNudgeTemplates(alertType: string, studentName: string, businessName: string) {
  const templates: Record<string, string[]> = {
    emotional: [
      `Hey ${studentName}, I can see you're working through some tough stuff. Your work on ${businessName} is strong. Take your time — I'm here when you're ready.`,
      `${studentName}, just checking in. You don't have to have it all figured out right now. What's one small thing you feel good about with ${businessName}?`,
    ],
    stuck: [
      `${studentName}, I see you've been on this lesson for a bit. Try breaking it into one small question: what's the ONE thing you're unsure about?`,
      `Hey ${studentName}, sometimes the best move is to write something imperfect and fix it later. What's your gut answer?`,
    ],
    inactive: [
      `Hey ${studentName}, just thinking about you. Your ${businessName} idea was really promising. No pressure — pick up whenever you're ready. I'm here.`,
      `${studentName}, it's been a few days. Everything okay? Your ${businessName} work was strong — don't let it go cold.`,
    ],
    checkin_quality: [
      `${studentName}, I noticed your check-ins have been brief lately. Everything going okay? Even one real sentence helps me understand where you're at.`,
      `Hey ${studentName}, the check-ins work best when they're honest, even if short. What's one thing on your mind about ${businessName}?`,
    ],
    content_flag: [
      `${studentName}, I saw something in your recent work that I want to chat about. Can we find a few minutes to talk?`,
    ],
  };

  return templates[alertType] ?? [
    `Hey ${studentName}, just wanted to check in on your progress with ${businessName}. How's it going?`,
  ];
}

interface NudgeTemplatesProps {
  alertType: string;
  studentId: string;
  studentName: string;
  businessName: string;
  classId: string;
  onSent?: () => void;
}

export default function NudgeTemplates({
  alertType,
  studentId,
  studentName,
  businessName,
  classId,
  onSent,
}: NudgeTemplatesProps) {
  const [sending, setSending] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const templates = getNudgeTemplates(alertType, studentName, businessName);

  async function handleSend(index: number) {
    setSending(index);
    await sendNudge(studentId, classId, templates[index], `${alertType}_template_${index}`);
    setSending(null);
    setSent(true);
    onSent?.();
  }

  async function handleCustomSend() {
    if (!customMessage.trim()) return;
    setSending(-1);
    await sendNudge(studentId, classId, customMessage.trim());
    setSending(null);
    setSent(true);
    setCustomizing(false);
    onSent?.();
  }

  if (sent) {
    return (
      <p className="text-xs text-[var(--success)] font-medium mt-2">
        Message sent to {studentName}
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-[var(--text-muted)]">Quick nudge:</p>
      <div className="space-y-1.5">
        {templates.map((template, i) => (
          <button
            key={i}
            onClick={() => handleSend(i)}
            disabled={sending !== null}
            className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:border-[var(--primary)] transition-colors disabled:opacity-50"
          >
            {sending === i ? "Sending..." : template}
          </button>
        ))}
      </div>
      {!customizing ? (
        <button
          onClick={() => {
            setCustomizing(true);
            setCustomMessage(templates[0]);
          }}
          className="text-xs text-[var(--primary)] hover:underline"
        >
          Customize message
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCustomSend}
              disabled={!customMessage.trim() || sending !== null}
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {sending === -1 ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setCustomizing(false)}
              className="text-xs text-[var(--text-muted)] hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
