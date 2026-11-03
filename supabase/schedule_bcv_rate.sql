create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'abasto-bcv-rate-daily';

select cron.schedule(
  'abasto-bcv-rate-daily',
  '0 16,19,22 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'abasto_supabase_url'
    ) || '/functions/v1/bcv-rate-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'abasto_publishable_key'
      ),
      'x-bcv-sync-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'abasto_bcv_sync_secret'
      )
    ),
    body := jsonb_build_object('requested_at', now())
  );
  $$
);
