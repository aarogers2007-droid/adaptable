-- Migration 00041: Branding Asset Storage
--
-- Public bucket for org logos and favicons.
-- Write access restricted to org_admin and platform_owner roles.
-- Public read access (logos/favicons served without auth).

-- ══════════════════════════════════════════════════════════
-- PART 1: Create storage bucket
-- ══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- PART 2: Storage policies
-- ══════════════════════════════════════════════════════════

-- Public read — logos and favicons must be accessible without auth
CREATE POLICY "Public read access for branding assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding-assets');

-- Insert — org admins and platform owners only
CREATE POLICY "Org admins can upload branding assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role IN ('org_admin') OR is_platform_owner = true)
    )
  );

-- Update — org admins and platform owners only
CREATE POLICY "Org admins can update branding assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'branding-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role IN ('org_admin') OR is_platform_owner = true)
    )
  );

-- Delete — org admins and platform owners only
CREATE POLICY "Org admins can delete branding assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'branding-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role IN ('org_admin') OR is_platform_owner = true)
    )
  );
