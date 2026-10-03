-- Endurecimento de segurança (auditoria de 2026-10-02).

-- 1. Acesso Pró verificado no banco, não só na interface. Considera apenas
--    pagamentos confirmados; assinatura cancelada vale até o fim do período.
create or replace function public.has_pro_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.subscription_plans p on p.id = s.plan_id
    where s.user_id = (select auth.uid())
      and (
        (s.status = 'authorized' and (s.lifetime_access or p.pro_access))
        or (s.status = 'cancelled' and p.pro_access and s.current_period_end > now())
      )
  );
$$;

revoke all on function public.has_pro_access() from public, anon;
grant execute on function public.has_pro_access() to authenticated;

-- 2. Perfis: o usuário só altera campos de exibição. O e-mail é sincronizado
--    pelo Supabase Auth (gatilho) e o fuso horário inválido derrubava o cron.
revoke update on public.profiles from authenticated;
grant update (display_name, username, avatar_url, onboarding_completed) on public.profiles to authenticated;

alter table public.profiles
  drop constraint if exists profiles_timezone_format;
alter table public.profiles
  add constraint profiles_timezone_format check (timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+){0,2}$');

-- 3. Biblioteca: técnicas próprias e modelos Pró exigem plano Pró.
drop policy if exists user_techniques_insert_own on public.user_techniques;
create policy user_techniques_insert_own on public.user_techniques
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and (
    (select public.has_pro_access())
    or exists (
      select 1 from public.techniques t
      where t.id = technique_id and not t.is_pro
    )
  )
);

drop policy if exists user_techniques_update_own on public.user_techniques;
create policy user_techniques_update_own on public.user_techniques
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    (select public.has_pro_access())
    or exists (
      select 1 from public.techniques t
      where t.id = technique_id and not t.is_pro
    )
  )
);

-- 4. Mídias de treino: upload só para Pró e apenas formatos de foto/vídeo
--    comuns (bloqueia SVG/HTML disfarçados de imagem).
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'
]::text[]
where id = 'training-media';

drop policy if exists training_media_insert_own on storage.objects;
create policy training_media_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'training-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select public.has_pro_access())
);

-- 5. Disponibilidade de usuário não precisa ser pública (cadastro usa a API).
revoke execute on function public.is_username_available(text) from anon;
revoke execute on function public.set_updated_at() from anon, authenticated;

-- 6. Workspace: não criar uma segunda assinatura "free" quando a atual está
--    cancelada/expirada (o índice parcial não cobre esses status e o app
--    passava a ler duas linhas).
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

  if not exists (select 1 from public.subscriptions where user_id = current_user_id) then
    insert into public.subscriptions (user_id, plan_id, status)
    values (current_user_id, 'free', 'free')
    on conflict do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.ensure_user_workspace() from public, anon;
grant execute on function public.ensure_user_workspace() to authenticated;
