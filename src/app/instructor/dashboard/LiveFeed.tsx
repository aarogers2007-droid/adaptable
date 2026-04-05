"use client";

import { useState, useMemo } from "react";

export interface FeedItem {
  id: string;
  studentName: string;
  action: string;
  detail: string;
  type: "lesson_started" | "lesson_completed" | "chat_activity" | "ikigai_completed";
  timestamp: string;
}

interface LiveFeedProps {
  items: FeedItem[];
}

const TYPE_COLORS: Record<string, string> = {
  lesson_started: "bg-[var(--primary)]",
  lesson_completed: "bg-[var(--success)]",
  chat_activity: "bg-[var(--info)]",
  ikigai_completed: "bg-[var(--accent)]",
};

const TYPE_LABELS: Record<string, string> = {
  lesson_started: "Started",
  lesson_completed: "Completed",
  chat_activity: "Chat",
  ikigai_completed: "Ikigai",
};

type TimeFilter = "24h" | "week" | "all";

export default function LiveFeed({ items }: LiveFeedProps) {
  const [filter, setFilter] = useState<TimeFilter>("24h");

  const filteredItems = useMemo(() => {
    const now = Date.now();
    return items.filter((item) => {
      if (filter === "all") return true;
      const age = now - new Date(item.timestamp).getTime();
      if (filter === "24h") return age < 24 * 60 * 60 * 1000;
      if (filter === "week") return age < 7 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [items, filter]);

  const filters: { key: TimeFilter; label: string }[] = [
    { key: "24h", label: "Last 24 hours" },
    { key: "week", label: "Last week" },
    { key: "all", label: "All time" },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
      {/* Filter buttons */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] px-4 py-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {filteredItems.length} event{filteredItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Feed */}
      {filteredItems.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No activity in this time period.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Activity will appear here as students work through lessons.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_COLORS[item.type] ?? "bg-[var(--bg-muted)]"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-medium">{item.studentName}</span>{" "}
                  <span className="text-[var(--text-secondary)]">{item.action}</span>{" "}
                  <span className="font-medium">{item.detail}</span>
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                  <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
