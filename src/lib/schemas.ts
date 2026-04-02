import { z } from "zod/v4";

/**
 * Zod schemas for runtime validation of student-generated artifacts.
 * Each lesson type has its own schema. The artifact must pass validation
 * for the milestone to count as "complete."
 */

export const businessIdeaSchema = z.object({
  niche: z.string().min(1),
  name: z.string().min(1),
  target_customer: z.string().min(1),
  revenue_model: z.string().min(1),
});

export const ikigaiResultSchema = z.object({
  passions: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  needs: z.array(z.string()).min(1),
  monetization: z.string().min(1),
});

export const ikigaiDraftSchema = z.object({
  step: z.number().int().min(1).max(4),
  passions: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  needs: z.array(z.string()).optional(),
  monetization: z.string().optional(),
});

// Lesson artifact schemas (per lesson type)

export const customerProfileSchema = z.object({
  type: z.literal("customer_profile"),
  name: z.string().min(1),
  age: z.string().min(1),
  problem: z.string().min(1),
  current_solution: z.string().min(1),
  why_switch: z.string().min(1),
});

export const competitorResearchSchema = z.object({
  type: z.literal("competitor_research"),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        offering: z.string().min(1),
        pricing: z.string().min(1),
        differentiator: z.string().min(1),
      })
    )
    .min(1),
});

export const customerInterviewSchema = z.object({
  type: z.literal("customer_interview"),
  questions: z.array(z.string()).min(3),
  insights: z.string().optional(),
});

export const pricingAnalysisSchema = z.object({
  type: z.literal("pricing_analysis"),
  competitors: z.array(
    z.object({
      name: z.string(),
      price: z.string(),
    })
  ),
  chosen_price: z.string().min(1),
  reasoning: z.string().min(1),
});

export const customerAcquisitionPlanSchema = z.object({
  type: z.literal("customer_acquisition_plan"),
  where: z.string().min(1),
  how: z.string().min(1),
  message: z.string().min(1),
  deadline: z.string().min(1),
});

/**
 * Validate any artifact against its type-specific schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateArtifact(artifact: unknown) {
  if (!artifact || typeof artifact !== "object" || !("type" in artifact)) {
    return { success: false as const, error: "Missing or invalid artifact type" };
  }

  const type = (artifact as { type: string }).type;

  const schemaMap: Record<string, z.ZodType> = {
    customer_profile: customerProfileSchema,
    competitor_research: competitorResearchSchema,
    customer_interview: customerInterviewSchema,
    pricing_analysis: pricingAnalysisSchema,
    customer_acquisition_plan: customerAcquisitionPlanSchema,
  };

  const schema = schemaMap[type];
  if (!schema) {
    return { success: false as const, error: `Unknown artifact type: ${type}` };
  }

  const result = schema.safeParse(artifact);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return { success: false as const, error: result.error.message };
}
