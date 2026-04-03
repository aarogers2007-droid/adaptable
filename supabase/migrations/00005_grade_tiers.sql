/*
 * Grade tier support for multi-level content.
 *
 * elementary   — K-5, planting entrepreneurial seeds
 * middle_school — 6-8, structured activities and guided projects
 * high_school  — 9-12, real business building (current build)
 *
 * Everything defaults to high_school. When middle/elementary
 * content is added later, students see only their tier's content.
 */

CREATE TYPE grade_tier AS ENUM ('elementary', 'middle_school', 'high_school');

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_tier grade_tier NOT NULL DEFAULT 'high_school';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS grade_tier grade_tier NOT NULL DEFAULT 'high_school';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS grade_tier grade_tier NOT NULL DEFAULT 'high_school';
