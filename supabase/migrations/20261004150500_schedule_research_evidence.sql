-- Sync existing source evidence into field-level claims once per day.
-- The function is cron-secret protected and only creates evidence/review records;
-- it does not publish or approve claims.
SELECT cron.schedule(
  'sync-research-evidence-daily',
  '15 5 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/sync-research-evidence',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);
