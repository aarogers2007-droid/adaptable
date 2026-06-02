import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Adaptable — Turn Curriculum into Measurable Student Outcomes",
  description:
    "Adaptable gives organizations engagement data they've never had. Students learn through AI-guided lessons. You get proof of impact for sponsors and grants.",
  openGraph: {
    title: "Adaptable — Turn Curriculum into Measurable Student Outcomes",
    description:
      "Adaptable gives organizations engagement data they've never had. Students learn through AI-guided lessons. You get proof of impact for sponsors and grants.",
    url: "https://adaptable.one",
    siteName: "Adaptable",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] max-w-3xl">
          Turn your curriculum into measurable student outcomes
        </h1>
        <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl">
          Adaptable gives organizations engagement data they&apos;ve never had. Students learn through AI. You get proof of impact for sponsors and grants.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/start"
            className="rounded-lg bg-[var(--primary)] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
          >
            Start Your Program
          </Link>
          <Link
            href="/start"
            className="rounded-lg border border-[var(--border-strong)] px-8 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            Get Started
          </Link>
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Student data is encrypted and never shared.
        </p>
      </section>

      {/* What it does */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)] text-left">
            How it works
          </h2>
          <div className="mt-12 flex flex-col gap-8 text-left">
            <div className="flex items-start gap-5">
              <div className="text-3xl font-semibold text-[var(--primary)] shrink-0 w-10">1</div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Students learn through AI</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  AI-guided lessons led by an AI mentor that adapts to every student&apos;s interests, grade level, and pace. Each student builds a real business concept.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="text-3xl font-semibold text-[var(--primary)] shrink-0 w-10">2</div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Every interaction produces data</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Completion rates, time on platform, lesson-by-lesson progress, business ideas created, and crisis detection. All tracked, all exportable.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="text-3xl font-semibold text-[var(--primary)] shrink-0 w-10">3</div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">You get proof of impact</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  One-click reports for sponsors and grant applications. Your logo, your data, your story. Before this platform, you had anecdotes. After, you have numbers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-[var(--border)] px-6 py-16">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-[var(--primary)]">20+</div>
            <div className="mt-1 text-xs text-[var(--text-muted)] uppercase tracking-wide">AI-guided lessons</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--primary)]">K-12</div>
            <div className="mt-1 text-xs text-[var(--text-muted)] uppercase tracking-wide">Grade levels supported</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--primary)]">10+</div>
            <div className="mt-1 text-xs text-[var(--text-muted)] uppercase tracking-wide">Languages for safety</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--primary)]">100%</div>
            <div className="mt-1 text-xs text-[var(--text-muted)] uppercase tracking-wide">White-label branded</div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
            Built for organizations that need to prove impact
          </h2>
          <p className="mt-6 text-[var(--text-secondary)] leading-relaxed">
            Before this platform, you have no engagement data. After, you have all of it. What that data is worth to your sponsors and grant applications is something only you can answer, because you know your funders. We give you the proof. You decide what to do with it.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/start"
              className="rounded-lg bg-[var(--primary)] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
            >
              Start Your Program
            </Link>
            <Link
              href="/start"
              className="rounded-lg border border-[var(--border-strong)] px-8 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/start" className="py-2 hover:text-[var(--text-primary)] transition-colors">Get Started</Link>
            <Link href="/login" className="py-2 hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
            <Link href="/privacy" className="py-2 hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Adaptable &copy; {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </main>
  );
}
