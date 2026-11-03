create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  tax_id text,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index suppliers_tax_id_unique
  on public.suppliers (lower(tax_id))
  where tax_id is not null and trim(tax_id) <> '';
create index suppliers_active_name on public.suppliers (active, name);

alter table public.suppliers enable row level security;
create policy suppliers_owner_access on public.suppliers
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
grant select, insert, update, delete on public.suppliers to authenticated;

create or replace function public.update_managed_profile(
  p_profile_id uuid,
  p_name text,
  p_role public.user_role,
  p_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_target public.profiles;
begin
  if not public.is_owner() then
    raise exception 'OWNER_REQUIRED';
  end if;
  perform pg_advisory_xact_lock(hashtext('managed_profile_owner_invariant'));
  if nullif(trim(p_name), '') is null or p_role is null or p_active is null then
    raise exception 'PROFILE_FIELDS_REQUIRED';
  end if;

  select * into v_target
  from public.profiles
  where id = p_profile_id
  for update;
  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if p_profile_id = auth.uid() and (p_role <> 'dueno' or not p_active) then
    raise exception 'CANNOT_REMOVE_OWN_OWNER_ACCESS';
  end if;

  if v_target.active and v_target.role = 'dueno'
    and (p_role <> 'dueno' or not p_active)
    and (
      select count(*) from public.profiles
      where active and role = 'dueno' and id <> p_profile_id
    ) = 0 then
    raise exception 'LAST_ACTIVE_OWNER_REQUIRED';
  end if;

  update public.profiles
  set name = trim(p_name), role = p_role, active = p_active, updated_at = now()
  where id = p_profile_id
  returning * into v_profile;
  return v_profile;
end;
$$;

revoke all on function public.update_managed_profile(uuid, text, public.user_role, boolean)
  from public, anon;
grant execute on function public.update_managed_profile(uuid, text, public.user_role, boolean)
  to authenticated;

comment on table public.suppliers is 'Directorio de proveedores administrado solo por dueños activos.';
