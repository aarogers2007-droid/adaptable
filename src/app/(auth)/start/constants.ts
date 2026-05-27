export const ONBOARDING_STEP = {
  ACCOUNT_CREATED: 1,
  ORG_NAMED: 2,
  BRANDED: 3,
  PAID: 4,
  CURRICULUM: 5,
  COMPLETE: 6,
} as const;

export type DraftLesson = {
  id: string;
  title: string;
  objective: string | null;
  module_name: string | null;
  module_sequence: number | null;
  lesson_sequence: number | null;
  ai_generated_plan: Record<string, unknown> | null;
  status: string;
  created_at: string;
};
