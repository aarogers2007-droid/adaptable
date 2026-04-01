import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="max-w-2xl text-center">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          Adaptable
        </h1>
        <p className="mt-4 text-xl text-[var(--text-secondary)]">
          Build your business. Learn by doing.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/join"
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
          >
            Join a Class
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[var(--border-strong)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
