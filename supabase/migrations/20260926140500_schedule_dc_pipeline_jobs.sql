SELECT cron.schedule(
  'discover-data-centers-daily',
  '30 4 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/discover-data-centers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );$$
)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'discover-data-centers-daily')
  AND current_setting('app.settings.supabase_url', true) IS NOT NULL
  AND current_setting('app.settings.service_role_key', true) IS NOT NULL;

SELECT cron.schedule(
  'generate-dc-changelog-weekly',
  '30 8 * * 1',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-dc-changelog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );$$
)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-dc-changelog-weekly')
  AND current_setting('app.settings.supabase_url', true) IS NOT NULL
  AND current_setting('app.settings.service_role_key', true) IS NOT NULL;
