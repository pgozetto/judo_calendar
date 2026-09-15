-- Mantém a recuperação do workspace idempotente mesmo com o índice parcial
-- de assinaturas atuais.
create or replace function public.ensure_user_workspace()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  current_metadata jsonb;
  requested_username text;
  final_username text;
  requested_name text;
begin
  if current_user_id is null then
    return false;
  end if;

  select email, raw_user_meta_data
  into current_email, current_metadata
  from auth.users
  where id = current_user_id;

  if current_email is null then
    return false;
  end if;

  requested_username := lower(regexp_replace(
    coalesce(current_metadata ->> 'username', split_part(current_email, '@', 1), 'judoca'),
    '[^a-z0-9_]', '_', 'g'
  ));
  requested_username := trim(both '_' from requested_username);
  if char_length(requested_username) < 3 then
    requested_username := 'judoca';
  end if;
  requested_username := left(requested_username, 30);
  final_username := requested_username;

  if exists (
    select 1 from public.profiles
    where username = final_username and id <> current_user_id
  ) then
    final_username := left(requested_username, 21) || '_' || substr(current_user_id::text, 1, 8);
  end if;

  requested_name := nullif(trim(coalesce(
    current_metadata ->> 'display_name',
    current_metadata ->> 'full_name',
    current_metadata ->> 'name',
    ''
  )), '');

  insert into public.profiles (id, username, display_name, email)
  values (
    current_user_id,
    final_username,
    coalesce(requested_name, initcap(replace(final_username, '_', ' '))),
    current_email
  )
  on conflict (id) do nothing;

  insert into public.training_schedules (user_id) values (current_user_id)
  on conflict (user_id) do nothing;
  insert into public.review_schedules (user_id) values (current_user_id)
  on conflict (user_id) do nothing;
  insert into public.email_preferences (user_id) values (current_user_id)
  on conflict (user_id) do nothing;
  insert into public.game_plans (user_id) values (current_user_id)
  on conflict (user_id) do nothing;
  insert into public.subscriptions (user_id, plan_id, status)
  values (current_user_id, 'free', 'free')
  on conflict do nothing;

  return true;
end;
$$;

revoke all on function public.ensure_user_workspace() from public;
grant execute on function public.ensure_user_workspace() to authenticated;
