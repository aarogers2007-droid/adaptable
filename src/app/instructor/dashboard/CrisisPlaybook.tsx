"use client";

import { useState } from "react";

export default function CrisisPlaybook() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700" aria-hidden="true">
            +
          </span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Crisis Response Guide
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {isOpen ? "Close" : "Open"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[var(--border)] px-5 py-5 space-y-6">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
              When You Receive a Crisis Alert
            </h3>
          </div>

          {/* Step 1 */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Step 1: Read the alert carefully
            </h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Note the student&apos;s name, the type of concern (self-harm, suicidal ideation, abuse, hopelessness), and when it was detected.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Step 2: Check the severity
            </h4>
            <ul className="space-y-2 ml-1">
              <li className="flex gap-2">
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">URGENT</span>
                <span className="text-sm text-[var(--text-secondary)]">
                  Self-harm, suicidal ideation: Act within 1 hour. If you believe the student is in immediate danger, call 911.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">HIGH</span>
                <span className="text-sm text-[var(--text-secondary)]">
                  Abuse signals: Act within 4 hours. If abuse is suspected, you are likely a mandated reporter. Contact your local Child Protective Services.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">CONCERNING</span>
                <span className="text-sm text-[var(--text-secondary)]">
                  Hopelessness, emotional distress: Act within 24 hours. Reach out to the student privately.
                </span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Step 3: Contact the student
            </h4>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)] list-disc ml-5">
              <li>If possible, speak to them in person or by phone. Not by text or message.</li>
              <li>Listen. Don&apos;t try to fix it. Say: &ldquo;I noticed something and I wanted to check in.&rdquo;</li>
              <li>Ask: &ldquo;Are you safe right now?&rdquo;</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Step 4: Follow your organization&apos;s protocol
            </h4>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)] list-disc ml-5">
              <li>If your org has a counselor or social worker, loop them in.</li>
              <li>If your org does not have clinical staff, contact a local crisis center for guidance.</li>
              <li>Document what you did and when.</li>
            </ul>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Step 5: Resolve the alert in the dashboard
            </h4>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)] list-disc ml-5">
              <li>Click &ldquo;Resolve&rdquo; on the alert.</li>
              <li>Add a resolution note (e.g., &ldquo;Spoke with student, connected with school counselor&rdquo;).</li>
              <li>This creates a record of your response.</li>
            </ul>
          </div>

          {/* Resources */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Resources
            </h4>
            <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li>
                <span className="font-medium">988 Suicide &amp; Crisis Lifeline:</span>{" "}
                Call or text 988 (presiona 2 para espa&ntilde;ol)
              </li>
              <li>
                <span className="font-medium">Crisis Text Line:</span>{" "}
                Text HOME to 741741
              </li>
              <li>
                <span className="font-medium">Childhelp National Child Abuse Hotline:</span>{" "}
                1-800-422-4453
              </li>
            </ul>
          </div>

          {/* Important note */}
          <div className="rounded-lg bg-[var(--bg-muted)] px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Important:</span>{" "}
              You are not expected to be a counselor. Your job is to notice, respond, and connect the student with professional help. The platform catches the signal. You close the loop.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
