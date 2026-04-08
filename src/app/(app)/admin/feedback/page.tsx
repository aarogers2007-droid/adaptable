import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/ui/AppNav";

export const metadata = {
  title: "Tester Feedback — Adaptable Admin",
};

interface FeedbackRow {
  id: string;
  user_name: string | null;
  page: string | null;
  message: string;
  rating: number | null;
  user_agent: string | null;
  created_at: string;
}

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    redirect("/dashboard");
  }

  const { data: feedbackRaw } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  const feedback = (feedbackRaw ?? []) as FeedbackRow[];

  // Aggregate stats
  const total = feedback.length;
  const withRating = feedback.filter((f) => f.rating !== null);
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, f) => s + (f.rating ?? 0), 0) / withRating.length
      : 0;
  const ratingCounts = [1, 2, 3, 4, 5].map(
    (n) => feedback.filter((f) => f.rating === n).length
  );

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav isAdmin={true} studentName={(profile.full_name as string) || undefined} />

      <div className="mx-auto max-w-[900px] px-6 py-8">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            Tester Feedback
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Every &ldquo;Tell AJ your thoughts&rdquo; submission, newest first.
          </p>
        </div>

        {/* Stats row */}
        {total > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Total responses</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">{total}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Avg rating</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
                {withRating.length > 0 ? avgRating.toFixed(1) : "—"}
                {withRating.length > 0 && (
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / 5</span>
                )}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {withRating.length} of {total} included a rating
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Distribution</p>
              <div className="mt-2 space-y-1">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = ratingCounts[n - 1];
                  const pct = withRating.length > 0 ? (count / withRating.length) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-[var(--text-muted)]">{n}★</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)]">
                        <div
                          className="h-1.5 rounded-full bg-[var(--accent)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right tabular-nums text-[var(--text-muted)]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {total === 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-12 text-center">
            <p className="text-2xl mb-2">📬</p>
            <p className="text-[var(--text-secondary)]">No feedback yet. Send the link to someone.</p>
          </div>
        )}

        {/* Feedback list */}
        <div className="space-y-4">
          {feedback.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {f.user_name || "Anonymous"}
                    </p>
                    {f.rating !== null && (
                      <span className="text-sm">
                        {"⭐".repeat(f.rating)}
                        <span className="opacity-30">{"⭐".repeat(5 - f.rating)}</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {new Date(f.created_at).toLocaleString()}
                    {f.page && <> &middot; <code className="font-mono">{f.page}</code></>}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-base text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                {f.message}
              </p>
              {f.user_agent && (
                <p className="mt-3 text-xs text-[var(--text-muted)] line-clamp-1">
                  {f.user_agent}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
