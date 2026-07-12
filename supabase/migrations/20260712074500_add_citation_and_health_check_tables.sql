-- Phase 2: additive citation/confidence columns for AI-generated content,
-- plus a generic pipeline health-check table.

ALTER TABLE market_signals     ADD COLUMN IF NOT EXISTS source_article_ids uuid[];
ALTER TABLE weekly_index       ADD COLUMN IF NOT EXISTS source_article_ids uuid[];
ALTER TABLE strategic_insights ADD COLUMN IF NOT EXISTS source_article_ids uuid[];

ALTER TABLE market_signals     ADD COLUMN IF NOT EXISTS confidence_tier text DEFAULT 'ai_inferred';
ALTER TABLE weekly_index       ADD COLUMN IF NOT EXISTS confidence_tier text DEFAULT 'ai_inferred';
ALTER TABLE strategic_insights ADD COLUMN IF NOT EXISTS confidence_tier text DEFAULT 'ai_inferred';

CREATE TABLE IF NOT EXISTS pipeline_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  table_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'stale', 'empty', 'missing_fields')),
  detail jsonb,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pipeline_health_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view health checks" ON pipeline_health_checks;
CREATE POLICY "Public can view health checks"
  ON pipeline_health_checks FOR SELECT
  USING (true);
