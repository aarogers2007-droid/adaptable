/**
 * Database types matching supabase/migrations/00001_schema.sql
 */

export type UserRole = "student" | "instructor" | "org_admin";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type GradeTier = "elementary" | "middle_school" | "high_school";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  org_id: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  business_idea: BusinessIdea | null;
  ikigai_result: IkigaiResult | null;
  ikigai_draft: IkigaiDraft | null;
  parent_access_pin: string | null;
  parent_access_token: string | null;
  niche_recommendations: NicheRecommendation[] | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessIdea {
  niche: string;
  name: string;
  target_customer: string;
  revenue_model: string;
  why_this_fits?: string;
}

export interface IkigaiResult {
  passions: string[];
  skills: string[];
  needs: string[];
  monetization: string;
}

export interface IkigaiDraft {
  step: number; // 1-4
  passions?: string[];
  skills?: string[];
  needs?: string[];
  monetization?: string;
}

export interface NicheRecommendation {
  business_name: string;
  description: string;
  pricing: string;
  customer_acquisition: string;
  key_lesson: string;
}

export interface Class {
  id: string;
  org_id: string;
  instructor_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  class_id: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_name: string;
  module_sequence: number;
  lesson_sequence: number;
  title: string;
  content_template: string;
  personalization_prompts: { example_prompt?: string } | null;
  video_url: string | null;
  curriculum_version: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: ProgressStatus;
  artifacts: Record<string, unknown> | null;
  cached_examples: string | null;
  cached_examples_version: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  student_id: string;
  context_snapshot: Record<string, unknown> | null;
  messages: ChatMessage[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MentorCheckin {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  student_id: string | null;
  feature: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number | null;
  created_at: string;
}
