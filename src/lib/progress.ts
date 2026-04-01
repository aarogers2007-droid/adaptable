import { validateArtifact } from "./schemas";
import type { StudentProgress } from "./types";

/**
 * Check if a lesson's artifact is complete (passes validation).
 */
export function isArtifactComplete(progress: StudentProgress): boolean {
  if (!progress.artifacts) return false;
  const result = validateArtifact(progress.artifacts);
  return result.success;
}

/**
 * Determine if a lesson should be marked as completed.
 * A lesson is complete when it has a valid artifact.
 */
export function shouldMarkComplete(progress: StudentProgress): boolean {
  return progress.status !== "completed" && isArtifactComplete(progress);
}
