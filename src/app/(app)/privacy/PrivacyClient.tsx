"use client";

import { useState, useTransition } from "react";
import { exportStudentData, requestDeletion, cancelDeletion } from "@/lib/data-rights";

interface PendingDeletion {
  id: string;
  scheduled_for: string;
  created_at: string;
}

interface PrivacyClientProps {
  studentId: string;
  pendingDeletion: PendingDeletion | null;
}

export default function PrivacyClient({ studentId, pendingDeletion }: PrivacyClientProps) {
  const [pending, setPending] = useState<PendingDeletion | null>(pendingDeletion);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleExport() {
    setExportStatus("Preparing your data...");
    const result = await exportStudentData(studentId);
    if (result.error || !result.json) {
      setExportStatus(result.error ?? "Export failed");
      setTimeout(() => setExportStatus(null), 4000);
      return;
    }
    const blob = new Blob([result.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename ?? `adaptable_export_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportStatus("Downloaded ✓");
    setTimeout(() => setExportStatus(null), 4000);
  }

  function handleRequestDelete() {
    setDeleteStatus("Submitting request...");
    startTransition(async () => {
      const result = await requestDeletion(studentId);
      if (result.error) {
        setDeleteStatus(result.error);
        setTimeout(() => setDeleteStatus(null), 4000);
        return;
      }
      if (result.requestId && result.scheduledFor) {
        setPending({
          id: result.requestId,
          scheduled_for: result.scheduledFor,
          created_at: new Date().toISOString(),
        });
        setDeleteStatus("Deletion scheduled");
        setConfirmingDelete(false);
      }
    });
  }

  function handleCancelDelete() {
    if (!pending) return;
    setDeleteStatus("Cancelling...");
    startTransition(async () => {
      const result = await cancelDeletion(pending.id);
      if (result.error) {
        setDeleteStatus(result.error);
        setTimeout(() => setDeleteStatus(null), 4000);
        return;
      }
      setPending(null);
      setDeleteStatus("Deletion cancelled. Your account is active again.");
      setTimeout(() => setDeleteStatus(null), 4000);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
          Your data & privacy
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          You own your data. Download a complete copy anytime, or request that we delete everything.
        </p>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Download your data</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Get a complete JSON file containing your profile, business idea, lessons, conversations,
          progress, and every interaction you&apos;ve had with Adaptable. You can take this anywhere.
        </p>
        <button
          onClick={handleExport}
          className="mt-4 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-light)] transition-colors"
        >
          Download my data (JSON)
        </button>
        {exportStatus && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">{exportStatus}</p>
        )}
      </div>

      {/* Delete */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Delete my account</h2>
        <p className="mt-1 text-sm text-red-800">
          Request that we delete your entire account and every piece of data tied to it.
          Deletion happens after a 30-day grace period — you can cancel any time before then.
        </p>

        {pending ? (
          <div className="mt-4 rounded-lg border border-red-300 bg-white p-4">
            <p className="text-sm font-semibold text-red-900">Deletion scheduled</p>
            <p className="mt-1 text-xs text-red-800">
              Your account is locked and will be permanently deleted on{" "}
              <strong>{new Date(pending.scheduled_for).toLocaleDateString()}</strong>.
            </p>
            <button
              onClick={handleCancelDelete}
              disabled={isPending}
              className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel deletion
            </button>
          </div>
        ) : confirmingDelete ? (
          <div className="mt-4 rounded-lg border border-red-300 bg-white p-4">
            <p className="text-sm font-semibold text-red-900">Are you sure?</p>
            <p className="mt-1 text-xs text-red-800">
              This will lock your account immediately. You have 30 days to cancel before
              everything is permanently deleted.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleRequestDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Yes, delete my account
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-50"
              >
                Never mind
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-900 hover:bg-red-50"
          >
            Request account deletion
          </button>
        )}

        {deleteStatus && (
          <p className="mt-3 text-xs text-red-800">{deleteStatus}</p>
        )}
      </div>

      <div className="text-xs text-[var(--text-muted)]">
        <p>
          We never sell student data. We never share student data with third parties for advertising.
          A copy of our full privacy policy lives at <a href="/privacy-policy" className="underline">/privacy-policy</a>.
        </p>
      </div>
    </div>
  );
}
