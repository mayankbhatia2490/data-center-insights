select cron.schedule(
  'discover-data-centers-daily',
  '30 4 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/discover-data-centers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

select cron.schedule(
  'generate-dc-changelog-weekly',
  '30 8 * * 1',
  $cmd$
  SELECT net.http_post(
    url := 'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/generate-dc-changelog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);
