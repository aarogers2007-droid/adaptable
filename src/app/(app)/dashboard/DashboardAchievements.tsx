"use client";

import { useState } from "react";
import AchievementBanner from "@/components/dashboard/AchievementBanner";
import AchievementPreview from "@/components/dashboard/AchievementPreview";
import type { NewlyAwarded } from "@/lib/achievements";

interface DashboardAchievementsProps {
  newlyAwarded: NewlyAwarded[];
  earned: { id: string; name: string; icon: string; tier: string }[];
}

export default function DashboardAchievements({
  newlyAwarded,
  earned,
}: DashboardAchievementsProps) {
  const [showBanner, setShowBanner] = useState(newlyAwarded.length > 0);

  return (
    <>
      {showBanner && newlyAwarded.length > 0 && (
        <div className="mb-4">
          <AchievementBanner
            achievements={newlyAwarded}
            onDismiss={() => setShowBanner(false)}
          />
        </div>
      )}
      <AchievementPreview achievements={earned} />
    </>
  );
}
