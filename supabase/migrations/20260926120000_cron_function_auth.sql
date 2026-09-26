-- Cron/operator Edge Functions (fetch-news, send-newsletter, market-signals, etc.)
-- had verify_jwt=false and no handler-level check, so anyone with the public
-- anon key (shipped in the frontend bundle) could invoke them directly —
-- triggering paid AI calls, or emailing every subscriber via send-newsletter.
-- pg_cron itself was authenticating with that same public anon key, which
-- provided no real security boundary.
--
-- Fix: generate a random secret known only to Postgres, expose it to the
-- functions' own service-role client via a restricted RPC, and have pg_cron
-- send it as `x-cron-secret`. The Edge Functions verify the header via
-- requireCronSecret() (supabase/functions/_shared/cronAuth.ts) before doing
-- any work.

select vault.create_secret(
  encode(gen_random_bytes(32), 'hex'),
  'cron_invoke_secret',
  'Shared secret pg_cron sends as x-cron-secret; verified by cron-invoked Edge Functions.'
);

create or replace function public.get_cron_secret()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret';
$$;

revoke all on function public.get_cron_secret() from public, anon, authenticated;
grant execute on function public.get_cron_secret() to service_role;

-- Repoint every cron-invoked function's job at the vault secret instead of
-- the public anon key. enrich-data-center-coordinates is left as-is (already
-- uses a separate, previously-reviewed auth path).
select cron.alter_job(
  job_id := jobid,
  command := format(
    $cmd$SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_invoke_secret')
      ),
      body := '{}'::jsonb
    );$cmd$,
    'https://jtsollavrhcobcmajyoa.supabase.co/functions/v1/' || jobname_to_slug.slug
  )
)
from cron.job
join (values
  ('fetch-news-every-2h', 'fetch-news'),
  ('generate-digest-daily', 'generate-digest'),
  ('send-daily-newsletter', 'send-newsletter'),
  ('fetch-stocks-every-4h', 'fetch-stocks'),
  ('fetch-events-daily', 'fetch-events'),
  ('extract-capacity-daily', 'extract-capacity'),
  ('market-signals-daily', 'market-signals'),
  ('strategic-insights-weekly', 'strategic-insights'),
  ('regional-outlook-weekly', 'regional-outlook'),
  ('word-cloud-daily', 'word-cloud'),
  ('generate-weekly-index', 'generate-weekly-index')
) as jobname_to_slug(jobname, slug) on jobname_to_slug.jobname = cron.job.jobname
where cron.job.jobname = jobname_to_slug.jobname;
