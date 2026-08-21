ALTER TABLE regional_outlook ADD COLUMN IF NOT EXISTS source_article_ids uuid[];
ALTER TABLE regional_outlook ADD COLUMN IF NOT EXISTS confidence_tier text DEFAULT 'ai_inferred';
