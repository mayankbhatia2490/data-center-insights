-- Phase 3: extract-people and compute-trending are confirmed dead code
-- (zero frontend consumers; extract-people wrote to an orphaned people_leaders
-- table the frontend never reads, compute-trending duplicated generate-weekly-index
-- writing to the same weekly_index table). extract-people had a live daily cron
-- burning Gemini calls for nothing; compute-trending had no live cron.
SELECT cron.unschedule('extract-people-daily');
