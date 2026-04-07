-- Migration 00019: Class-level microphone/voice kill switch
--
-- Background: admin reviewer flagged that VoiceInput.tsx uses Web Speech API
-- (microphone access on the student device) with no way for the instructor or
-- IT department to disable it. Microphone-on-Chromebook in a classroom is a
-- pilot blocker for any cautious district. We need a per-class toggle that
-- defaults to ON (current behavior) but can be flipped off without a code
-- change.
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS.

alter table classes
  add column if not exists voice_enabled boolean not null default true;

comment on column classes.voice_enabled is
  'When false, VoiceInput component is hidden for all students in this class. '
  'Districts with microphone restrictions can flip this off per class.';
