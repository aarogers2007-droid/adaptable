-- Migration 00035: Support chat conversations and escalation log
--
-- Stores AI support chat conversations and unresolved issue escalations.

CREATE TABLE IF NOT EXISTS support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count int NOT NULL DEFAULT 0,
  resolved boolean NOT NULL DEFAULT false,
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_user
  ON support_conversations(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS support_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name text,
  user_role text,
  summary text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_at timestamptz,
  resolution_notes text,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_escalations_status
  ON support_escalations(status, created_at DESC);

-- RLS
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_escalations ENABLE ROW LEVEL SECURITY;

-- Students and teachers can read/write their own conversations
CREATE POLICY "Users own their support conversations"
  ON support_conversations FOR ALL
  USING (user_id = auth.uid());

-- Platform owner can read all conversations
DROP POLICY IF EXISTS "Platform owner reads all support conversations" ON support_conversations;
CREATE POLICY "Platform owner reads all support conversations"
  ON support_conversations FOR SELECT
  USING ((SELECT is_platform_owner FROM profiles WHERE id = auth.uid()));

-- Users can read their own escalations
CREATE POLICY "Users own their escalations"
  ON support_escalations FOR ALL
  USING (user_id = auth.uid());

-- Platform owner can read/update all escalations
DROP POLICY IF EXISTS "Platform owner manages all escalations" ON support_escalations;
CREATE POLICY "Platform owner manages all escalations"
  ON support_escalations FOR ALL
  USING ((SELECT is_platform_owner FROM profiles WHERE id = auth.uid()));

-- Service role for the API route to insert escalations
CREATE POLICY "Service role inserts escalations"
  ON support_escalations FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER trg_support_conversations_updated_at
  BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
