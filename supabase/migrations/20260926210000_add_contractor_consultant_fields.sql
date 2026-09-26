-- Additive extension of the data_centers pipeline: distinguish EPC / main
-- contractor / consultant roles (previously all lumped into partners[]), and
-- capture cooling type and investment figures alongside the existing
-- power_source/power_notes pattern. Same shape as operators[]/partners[] —
-- plain text arrays, no company entity table.
ALTER TABLE public.data_centers
  ADD COLUMN IF NOT EXISTS epcs TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contractors TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS consultants TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS cooling_type TEXT
    CHECK (cooling_type IN ('air', 'liquid', 'hybrid', 'immersion', 'unknown')),
  ADD COLUMN IF NOT EXISTS cooling_notes TEXT,
  ADD COLUMN IF NOT EXISTS investment_usd_m NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS investment_notes TEXT;
