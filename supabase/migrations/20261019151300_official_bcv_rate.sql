alter table public.exchange_rates
  alter column value type numeric(18, 8);

alter table public.exchange_rates
  add column source text not null default 'manual'
    check (source in ('manual', 'bcv')),
  add column source_published_at timestamptz;

alter table public.exchange_rates
  add constraint exchange_rates_bcv_publication_date
    check (source <> 'bcv' or source_published_at is not null);

create or replace function public.record_official_bcv_rate(
  p_value numeric,
  p_published_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.exchange_rates;
  v_effective_at timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_value is null or p_value <= 0 or p_published_at is null then
    raise exception 'INVALID_OFFICIAL_RATE';
  end if;
  if p_published_at > now() + interval '1 day'
    or p_published_at < now() - interval '7 days' then
    raise exception 'OFFICIAL_RATE_DATE_OUT_OF_RANGE';
  end if;

  select * into v_current
  from public.exchange_rates
  where rate_type = 'bcv' and valid_to is null
  for update;

  if found and v_current.source = 'bcv'
    and p_published_at < v_current.source_published_at then
    return 'older_publication_ignored';
  end if;

  if found and v_current.source = 'bcv'
    and p_published_at = v_current.source_published_at then
    update public.exchange_rates
    set value = p_value, created_at = now()
    where id = v_current.id;
    return case when v_current.value = p_value then 'unchanged' else 'corrected' end;
  end if;

  if found then
    v_effective_at := greatest(
      clock_timestamp(),
      v_current.valid_from + interval '1 microsecond'
    );
    update public.exchange_rates
    set valid_to = v_effective_at
    where id = v_current.id;
  else
    v_effective_at := clock_timestamp();
  end if;

  insert into public.exchange_rates (
    rate_type, value, valid_from, source, source_published_at
  )
  values ('bcv', p_value, v_effective_at, 'bcv', p_published_at);

  return 'updated';
end;
$$;

revoke all on function public.record_official_bcv_rate(numeric, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_official_bcv_rate(numeric, timestamptz)
  to service_role;
