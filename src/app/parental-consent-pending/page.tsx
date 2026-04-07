export const metadata = {
  title: "Waiting for Parent Approval — Adaptable",
};

export default function ParentalConsentPendingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
          Hold tight
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          We sent your parent or guardian an email asking for permission. Once they click
          the link, your account unlocks and you can start.
        </p>
        <p className="mt-6 text-xs text-[var(--text-muted)]">
          Tell them to check their inbox (and the spam folder, just in case).
          The link expires in 7 days.
        </p>
        <p className="mt-8 text-xs text-[var(--text-muted)]">
          Already approved? Refresh this page or sign in again.
        </p>
      </div>
    </main>
  );
}
