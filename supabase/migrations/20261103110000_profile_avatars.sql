alter table public.profiles
  add column avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy user_avatars_read_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy user_avatars_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy user_avatars_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy user_avatars_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create or replace function public.set_my_avatar_path(p_avatar_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_avatar_path is not null
    and p_avatar_path !~ ('^' || auth.uid()::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'INVALID_AVATAR_PATH';
  end if;

  update public.profiles
  set avatar_path = p_avatar_path, updated_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.set_my_avatar_path(text) from public, anon;
grant execute on function public.set_my_avatar_path(text) to authenticated;
