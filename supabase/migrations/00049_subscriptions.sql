-- Migration 00049: Subscriptions table + org/profile columns for Stripe integration
-- Part of the org-first onboarding flow

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  plan_tier text NOT NULL CHECK (plan_tier IN ('starter', 'growth', 'scale')),
  student_quantity int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Read policies only. All writes use service role (admin client).
CREATE POLICY "Org admins read own subscription" ON subscriptions FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Platform owner reads all subscriptions" ON subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true
  ));

-- updated_at trigger (reuses existing function from prior migrations)
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add stripe_customer_id to organizations (unique per org)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- Update subscription_tier CHECK to include new tier values
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check
  CHECK (subscription_tier IN ('starter', 'growth', 'scale', 'standard', 'enterprise', 'internal'));

-- Add onboarding_step to profiles (tracks wizard progress for resume)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step int DEFAULT 0;
