SELECT cron.schedule(
  'verify-data-centers-daily',
  '40 3 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/verify-data-centers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );$$
)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verify-data-centers-daily')
  AND current_setting('app.settings.supabase_url', true) IS NOT NULL
  AND current_setting('app.settings.service_role_key', true) IS NOT NULL;
