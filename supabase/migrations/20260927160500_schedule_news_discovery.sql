-- Discover recent candidate articles every 30 minutes. The function stores
-- candidates only; fetch-news remains the publication gate.
SELECT cron.schedule(
  'discover-news-gdelt-every-30m',
  '*/30 * * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/discover-news-gdelt',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);
