-- fetch-stats-monthly was actively injecting fresh AI-hallucinated numbers into
-- the Statistics tables every month. Paused pending real data sourcing (deferred).
-- Reversible: SELECT cron.schedule('fetch-stats-monthly', '0 5 1 * *', ...) to resume.
SELECT cron.unschedule('fetch-stats-monthly');
