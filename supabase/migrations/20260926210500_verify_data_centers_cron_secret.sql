-- verify-data-centers-daily was missed by the earlier cron_function_auth
-- migration: its function had no requireCronSecret() check at all (unlike
-- discover-data-centers), and its cron job still sent the public
-- service_role_key as an `Authorization: Bearer` header instead of the
-- shared `x-cron-secret` used everywhere else in the dc-pipeline. Repoint it
-- the same way cron_function_auth.sql repointed the other cron-invoked
-- functions.
select cron.alter_job(
  job_id := jobid,
  command := $cmd$SELECT net.http_post(
    url := 'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/verify-data-centers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
    ),
    body := '{}'::jsonb
  );$cmd$
)
from cron.job
where cron.job.jobname = 'verify-data-centers-daily';
