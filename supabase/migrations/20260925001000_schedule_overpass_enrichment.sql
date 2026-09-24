-- Run after the source verification job. The function only considers missing coordinates,
-- stores an Overpass source record, and leaves all candidates pending human review.
SELECT cron.schedule(
  'enrich-data-center-coordinates-daily',
  '20 4 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/enrich-data-center-coordinates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );$$
)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enrich-data-center-coordinates-daily')
  AND current_setting('app.settings.supabase_url', true) IS NOT NULL
  AND current_setting('app.settings.service_role_key', true) IS NOT NULL;
