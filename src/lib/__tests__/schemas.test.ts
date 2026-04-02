import { describe, it, expect } from "vitest";
import {
  businessIdeaSchema,
  ikigaiResultSchema,
  validateArtifact,
} from "../schemas";

describe("businessIdeaSchema", () => {
  it("validates a complete business idea", () => {
    const result = businessIdeaSchema.safeParse({
      niche: "pet grooming",
      name: "AJ's Pet Grooming Studio",
      target_customer: "busy pet owners",
      revenue_model: "Charge per grooming session, with premium add-ons for nail trimming and teeth cleaning",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = businessIdeaSchema.safeParse({
      niche: "pet grooming",
      name: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("ikigaiResultSchema", () => {
  it("validates a complete ikigai result", () => {
    const result = ikigaiResultSchema.safeParse({
      passions: ["animals", "helping people"],
      skills: ["patient", "organized"],
      needs: ["pet care"],
      monetization: "per-session grooming fees",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty arrays", () => {
    const result = ikigaiResultSchema.safeParse({
      passions: [],
      skills: ["coding"],
      needs: ["tech help"],
      monetization: "consulting",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateArtifact", () => {
  it("validates a customer_profile artifact", () => {
    const result = validateArtifact({
      type: "customer_profile",
      name: "Sarah",
      age: "35",
      problem: "No time to groom her dog",
      current_solution: "Takes dog to PetSmart once a month",
      why_switch: "Wants in-home service, more convenient",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown artifact types", () => {
    const result = validateArtifact({ type: "unknown_type" });
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = validateArtifact(null);
    expect(result.success).toBe(false);
  });

  it("validates a pricing_analysis artifact", () => {
    const result = validateArtifact({
      type: "pricing_analysis",
      competitors: [{ name: "PetSmart", price: "$55/session" }],
      chosen_price: "$45/session",
      reasoning: "Slightly below PetSmart to attract first customers",
    });
    expect(result.success).toBe(true);
  });

  it("rejects incomplete pricing_analysis", () => {
    const result = validateArtifact({
      type: "pricing_analysis",
      competitors: [],
      chosen_price: "",
      reasoning: "",
    });
    expect(result.success).toBe(false);
  });
});
