-- Migration 00053: Curriculum Ingestion
--
-- Enables orgs to upload their own curriculum (PDF/DOCX/PPTX/TXT),
-- chunk it for RAG retrieval, and generate draft lessons from it.
--
-- Changes:
--   1. Add org_id to knowledge_base and lessons
--   2. Add curriculum_source to organizations
--   3. Create curriculum_uploads, curriculum_chunks, curriculum_draft_lessons
--   4. Create private storage bucket 'curriculum-files'
--   5. Update match_knowledge_from_candidates RPC with optional org filter
--   6. RLS policies for all new tables

-- ══════════════════════════════════════════════════════════
-- PART 1: Add org_id to knowledge_base
-- ══════════════════════════════════════════════════════════

ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id)
    DEFAULT '00000000-0000-0000-0000-000000000001';

-- Backfill existing rows
UPDATE knowledge_base SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_base_org ON knowledge_base(org_id);

-- ══════════════════════════════════════════════════════════
-- PART 2: Add org_id to lessons, replace unique constraint
-- ══════════════════════════════════════════════════════════

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id)
    DEFAULT '00000000-0000-0000-0000-000000000001';

-- Backfill existing rows
UPDATE lessons SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_org ON lessons(org_id);

-- Drop old unique constraint and add org-scoped one.
-- The original constraint was created inline as unique(module_sequence, lesson_sequence)
-- which Postgres names automatically as lessons_module_sequence_lesson_sequence_key.
ALTER TABLE lessons
  DROP CONSTRAINT IF EXISTS lessons_module_sequence_lesson_sequence_key;

ALTER TABLE lessons
  ADD CONSTRAINT lessons_org_module_lesson_unique
    UNIQUE (org_id, module_sequence, lesson_sequence);

-- ══════════════════════════════════════════════════════════
-- PART 3: Add curriculum_source to organizations
-- ══════════════════════════════════════════════════════════

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS curriculum_source text NOT NULL DEFAULT 'default'
    CHECK (curriculum_source IN ('default', 'custom'));

-- ══════════════════════════════════════════════════════════
-- PART 4: curriculum_uploads
-- ══════════════════════════════════════════════════════════

CREATE TABLE curriculum_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'txt')),
  chunk_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  error_message text,
  ip_consent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_uploads_org ON curriculum_uploads(org_id);

ALTER TABLE curriculum_uploads ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════
-- PART 5: curriculum_chunks
-- ══════════════════════════════════════════════════════════

CREATE TABLE curriculum_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  upload_id uuid NOT NULL REFERENCES curriculum_uploads(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  source_file text NOT NULL,
  source_page int,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_org ON curriculum_chunks(org_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_upload ON curriculum_chunks(upload_id);

ALTER TABLE curriculum_chunks ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════
-- PART 6: curriculum_draft_lessons
-- ══════════════════════════════════════════════════════════

CREATE TABLE curriculum_draft_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  title text NOT NULL,
  objective text,
  module_name text,
  module_sequence int,
  lesson_sequence int,
  source_chunk_ids uuid[],
  ai_generated_plan jsonb,
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'rejected', 'edited')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_draft_lessons_org ON curriculum_draft_lessons(org_id);

ALTER TABLE curriculum_draft_lessons ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER trg_curriculum_draft_lessons_updated_at
  BEFORE UPDATE ON curriculum_draft_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════
-- PART 7: Private storage bucket for curriculum files
-- ══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculum-files', 'curriculum-files', false)
ON CONFLICT (id) DO NOTHING;

-- Upload — org admins only, scoped to their org folder
CREATE POLICY "Org admins upload curriculum files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'curriculum-files'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'org_admin' OR is_platform_owner = true)
    )
  );

-- Read — org admins only
CREATE POLICY "Org admins read curriculum files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'curriculum-files'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'org_admin' OR is_platform_owner = true)
    )
  );

-- Delete — org admins only
CREATE POLICY "Org admins delete curriculum files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'curriculum-files'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'org_admin' OR is_platform_owner = true)
    )
  );

-- ══════════════════════════════════════════════════════════
-- PART 8: RLS policies for curriculum tables
-- ══════════════════════════════════════════════════════════

-- ---- curriculum_uploads ----

CREATE POLICY "Org admins manage own curriculum uploads"
  ON curriculum_uploads FOR ALL
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
  );

CREATE POLICY "Platform owners read all curriculum uploads"
  ON curriculum_uploads FOR SELECT
  USING (
    (SELECT is_platform_owner FROM profiles WHERE id = auth.uid())
  );

-- ---- curriculum_chunks ----

CREATE POLICY "Org admins read own curriculum chunks"
  ON curriculum_chunks FOR SELECT
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
  );

CREATE POLICY "Platform owners read all curriculum chunks"
  ON curriculum_chunks FOR SELECT
  USING (
    (SELECT is_platform_owner FROM profiles WHERE id = auth.uid())
  );

-- ---- curriculum_draft_lessons ----

CREATE POLICY "Org admins manage own draft lessons"
  ON curriculum_draft_lessons FOR ALL
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
  );

CREATE POLICY "Platform owners read all draft lessons"
  ON curriculum_draft_lessons FOR SELECT
  USING (
    (SELECT is_platform_owner FROM profiles WHERE id = auth.uid())
  );

-- ══════════════════════════════════════════════════════════
-- PART 9: Update match_knowledge_from_candidates RPC
-- ══════════════════════════════════════════════════════════

-- Add optional filter_org_id parameter. When provided, restricts
-- results to knowledge_base entries belonging to that org.
-- When NULL (default), returns all candidates (backward-compatible).

CREATE OR REPLACE FUNCTION match_knowledge_from_candidates(
  query_embedding vector(1536),
  candidate_ids uuid[],
  match_count int DEFAULT 3,
  filter_org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  verified boolean,
  key_principles jsonb,
  concrete_examples jsonb,
  quotes jsonb,
  student_friendly_summary text,
  challenge_qa jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.verified,
    kb.key_principles,
    kb.concrete_examples,
    kb.quotes,
    kb.student_friendly_summary,
    kb.challenge_qa,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.id = ANY(candidate_ids)
    AND kb.embedding IS NOT NULL
    AND (filter_org_id IS NULL OR kb.org_id = filter_org_id)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
