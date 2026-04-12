"use client";

import { useState } from "react";
import MirrorModal from "@/components/mirror/MirrorModal";

interface DashboardMirrorProps {
  mirrorPrompt: string;
  triggerType: "return_from_absence" | "weekly_review";
  emotionalSnapshot?: string;
  daysAbsent?: number;
}

/**
 * Client wrapper that shows a MirrorModal on the dashboard.
 * The server component detects the trigger condition and passes
 * the pre-generated prompt as a prop.
 */
export default function DashboardMirror({
  mirrorPrompt,
  triggerType,
  emotionalSnapshot,
  daysAbsent,
}: DashboardMirrorProps) {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <MirrorModal
      mirrorPrompt={mirrorPrompt}
      triggerType={triggerType}
      emotionalSnapshot={emotionalSnapshot}
      daysAbsent={daysAbsent}
      onClose={() => setShow(false)}
    />
  );
}
