/**
 * Universal Rubric Bank for the Scenario System.
 *
 * Every scenario on the platform selects 1-3 criteria from this bank.
 * This file is the single source of truth for all rubric criteria.
 * Nothing else defines them.
 */

export interface RubricCriterion {
  id: string;
  description: string;
  short_label: string;
}

export const UNIVERSAL_RUBRIC: readonly RubricCriterion[] = [
  {
    id: "CUSTOMER_CLARITY",
    description:
      "Student identifies a specific customer segment with real characteristics beyond generic demographics like everyone or young people.",
    short_label: "Customer Clarity",
  },
  {
    id: "PROBLEM_VALIDATION",
    description:
      "Student articulates the specific problem or unmet need the business situation is addressing, not just the surface context.",
    short_label: "Problem Validation",
  },
  {
    id: "SOLUTION_VIABILITY",
    description:
      "Student proposes a solution that is feasible and directly addresses the identified problem or situation.",
    short_label: "Solution Viability",
  },
  {
    id: "VALUE_PROPOSITION",
    description:
      "Student explains why a customer would choose this over existing alternatives.",
    short_label: "Value Proposition",
  },
  {
    id: "REVENUE_LOGIC",
    description:
      "Student demonstrates coherent thinking about how the business or decision generates or preserves revenue.",
    short_label: "Revenue Logic",
  },
  {
    id: "CONSTRAINT_RECOGNITION",
    description:
      "Student identifies at least one real operational, financial, regulatory, or market constraint relevant to the situation.",
    short_label: "Constraint Recognition",
  },
] as const;

export const RUBRIC_MAP = new Map(
  UNIVERSAL_RUBRIC.map((c) => [c.id, c])
);

export const VALID_CRITERION_IDS = new Set(
  UNIVERSAL_RUBRIC.map((c) => c.id)
);
