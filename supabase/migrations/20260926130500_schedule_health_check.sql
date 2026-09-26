-- health-check existed but was never scheduled, so the pipeline stall
-- that let regional-outlook/strategic-insights/weekly-index sit dead for
-- two months would have gone undetected even if it happened again.
-- Runs daily, after the morning digest/market pipelines have had time to
-- fire, so a same-day check reflects that day's runs.
select cron.schedule(
  'health-check-daily',
  '0 9 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/health-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);
