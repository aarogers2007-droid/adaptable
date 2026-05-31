"use client";

import { useState, useEffect } from "react";
import { getBusinessIdeaDistribution, type BusinessSegment } from "./impact-actions";
import { CATEGORY_COLORS } from "@/lib/niche-categories";

interface Props {
  orgId: string;
}

export default function StudentSegments({ orgId }: Props) {
  const [segments, setSegments] = useState<BusinessSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusinessIdeaDistribution(orgId)
      .then((data) => setSegments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-[var(--bg-muted)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] py-4">Students haven&apos;t created business ideas yet</p>;
  }

  const maxCount = Math.max(...segments.map((s) => s.count));

  return (
    <div className="space-y-2">
      {segments.map((segment) => (
        <div key={segment.category} className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-primary)] w-32 shrink-0 truncate">
            {segment.category}
          </span>
          <div className="flex-1 h-7 rounded-lg bg-[var(--bg-muted)] overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${(segment.count / maxCount) * 100}%`,
                background: CATEGORY_COLORS[segment.category] ?? CATEGORY_COLORS["Other"],
                minWidth: "2rem",
              }}
            />
          </div>
          <span className="text-sm text-[var(--text-secondary)] w-16 text-right shrink-0">
            {segment.count} ({segment.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}
