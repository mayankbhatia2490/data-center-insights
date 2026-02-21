SELECT cron.schedule(
  'generate-weekly-index',
  '0 8 * * 1',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-weekly-index',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );$$
);