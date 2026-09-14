-- Judo Calendar: schema inicial, autenticação, RLS, storage e billing.
-- Senhas pertencem exclusivamente ao Supabase Auth (auth.users); nunca são
-- copiadas para o schema public.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create type public.training_intensity as enum ('light', 'moderate', 'hard');
create type public.subscription_status as enum ('free', 'pending', 'authorized', 'paused', 'cancelled', 'expired', 'payment_failed');
create type public.payment_provider as enum ('mercado_pago');
create type public.delivery_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null,
  email extensions.citext not null,
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username::text ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 2 and 80)
);

create table public.training_records (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  training_date date not null,
  title text not null default 'Treino de judô',
  learned text not null default '',
  mistakes text not null default '',
  next_focus text not null default '',
  intensity public.training_intensity not null default 'moderate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_records_one_per_day unique (user_id, training_date),
  constraint training_records_title_length check (char_length(title) between 1 and 120),
  constraint training_records_content_length check (
    char_length(learned) <= 10000 and
    char_length(mistakes) <= 10000 and
    char_length(next_focus) <= 10000
  )
);

create table public.game_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  objective text not null default '',
  grip text not null default '',
  first_attack text not null default '',
  combination text not null default '',
  groundwork text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_plans_one_active_draft unique (user_id)
);

create table public.free_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null default '',
  category text not null default 'Geral',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_notes_title_length check (char_length(title) between 1 and 160),
  constraint free_notes_content_length check (char_length(content) <= 20000),
  constraint free_notes_category_length check (char_length(category) between 1 and 40)
);

create table public.training_schedules (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weekdays smallint[] not null default array[1, 3, 5]::smallint[],
  local_time time not null default '18:30',
  reminder_minutes_before smallint not null default 60,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_schedules_valid_weekdays check (
    weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  constraint training_schedules_valid_reminder check (reminder_minutes_before between 0 and 1440)
);

create table public.review_schedules (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weekday smallint not null default 0,
  local_time time not null default '19:00',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_schedules_valid_weekday check (weekday between 0 and 6)
);

create table public.email_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  product_emails boolean not null default true,
  training_reminders boolean not null default true,
  weekly_review boolean not null default true,
  competition_alerts boolean not null default true,
  offers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.federation_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null,
  external_id text not null,
  title text not null,
  version text,
  source_url text not null,
  published_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint federation_sources_external_unique unique (provider, external_id),
  constraint federation_sources_url_is_https check (source_url ~ '^https://')
);

create table public.competitions (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  place text,
  status text not null default 'scheduled',
  description text not null default '',
  categories text not null default '',
  federation text not null default 'FPJUDO',
  source_url text not null,
  source_label text not null,
  source_checked_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_date_order check (ends_on >= starts_on),
  constraint competitions_source_is_https check (source_url ~ '^https://')
);

create table public.competition_alerts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  days_before smallint[] not null default array[30, 7, 1]::smallint[],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_alerts_unique unique (user_id, competition_id),
  constraint competition_alerts_valid_days check (
    days_before <@ array[1, 2, 3, 7, 14, 21, 30, 45, 60, 90]::smallint[]
  )
);

create table public.techniques (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  classification text not null,
  description text not null default '',
  is_pro boolean not null default true,
  sort_order smallint not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_techniques (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  technique_id uuid references public.techniques(id) on delete set null,
  custom_name text,
  notes text not null default '',
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_techniques_has_name check (technique_id is not null or nullif(trim(custom_name), '') is not null)
);

create table public.subscription_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  price_cents integer not null default 0,
  currency text not null default 'BRL',
  interval text not null,
  pro_access boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_price check (price_cents >= 0),
  constraint subscription_plans_interval check (interval in ('free', 'month', 'lifetime'))
);

create table public.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  provider public.payment_provider,
  provider_subscription_id text,
  provider_payment_id text,
  status public.subscription_status not null default 'free',
  current_period_start timestamptz,
  current_period_end timestamptz,
  lifetime_access boolean not null default false,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_current_per_user
  on public.subscriptions(user_id)
  where status in ('free', 'pending', 'authorized', 'paused', 'payment_failed');

create unique index subscriptions_provider_id_unique
  on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;

create table public.payment_events (
  id uuid primary key default extensions.gen_random_uuid(),
  provider public.payment_provider not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  constraint payment_events_idempotency unique (provider, provider_event_id, event_type)
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'info',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.email_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  dedupe_key text not null unique,
  recipient extensions.citext not null,
  provider_message_id text,
  status public.delivery_status not null default 'pending',
  attempts smallint not null default 0,
  last_error text,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_records_user_date_idx on public.training_records(user_id, training_date desc);
create index free_notes_user_updated_idx on public.free_notes(user_id, updated_at desc);
create index competitions_upcoming_idx on public.competitions(starts_on) where published;
create index competition_alerts_user_idx on public.competition_alerts(user_id) where enabled;
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index email_deliveries_due_idx on public.email_deliveries(scheduled_for) where status = 'pending';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger training_records_set_updated_at before update on public.training_records
for each row execute function public.set_updated_at();
create trigger game_plans_set_updated_at before update on public.game_plans
for each row execute function public.set_updated_at();
create trigger free_notes_set_updated_at before update on public.free_notes
for each row execute function public.set_updated_at();
create trigger training_schedules_set_updated_at before update on public.training_schedules
for each row execute function public.set_updated_at();
create trigger review_schedules_set_updated_at before update on public.review_schedules
for each row execute function public.set_updated_at();
create trigger email_preferences_set_updated_at before update on public.email_preferences
for each row execute function public.set_updated_at();
create trigger federation_sources_set_updated_at before update on public.federation_sources
for each row execute function public.set_updated_at();
create trigger competitions_set_updated_at before update on public.competitions
for each row execute function public.set_updated_at();
create trigger competition_alerts_set_updated_at before update on public.competition_alerts
for each row execute function public.set_updated_at();
create trigger techniques_set_updated_at before update on public.techniques
for each row execute function public.set_updated_at();
create trigger user_techniques_set_updated_at before update on public.user_techniques
for each row execute function public.set_updated_at();
create trigger subscription_plans_set_updated_at before update on public.subscription_plans
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
create trigger email_deliveries_set_updated_at before update on public.email_deliveries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  final_username text;
  requested_name text;
begin
  requested_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1), 'judoca'),
    '[^a-z0-9_]', '_', 'g'
  ));
  requested_username := trim(both '_' from requested_username);
  if char_length(requested_username) < 3 then
    requested_username := 'judoca';
  end if;
  requested_username := left(requested_username, 30);
  final_username := requested_username;

  if exists (select 1 from public.profiles where username = final_username) then
    final_username := left(requested_username, 21) || '_' || substr(new.id::text, 1, 8);
  end if;

  requested_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  )), '');

  insert into public.profiles (id, username, display_name, email)
  values (
    new.id,
    final_username,
    coalesce(requested_name, initcap(replace(final_username, '_', ' '))),
    coalesce(new.email, final_username || '@social.local')
  );

  insert into public.training_schedules (user_id) values (new.id);
  insert into public.review_schedules (user_id) values (new.id);
  insert into public.email_preferences (user_id) values (new.id);
  insert into public.game_plans (user_id) values (new.id);
  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'free');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = coalesce(new.email, email)
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
after update of email on auth.users
for each row execute function public.handle_auth_user_updated();

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate ~ '^[a-z0-9_]{3,30}$'
    and not exists (
      select 1 from public.profiles where username = candidate
    );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.training_records enable row level security;
alter table public.game_plans enable row level security;
alter table public.free_notes enable row level security;
alter table public.training_schedules enable row level security;
alter table public.review_schedules enable row level security;
alter table public.email_preferences enable row level security;
alter table public.federation_sources enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_alerts enable row level security;
alter table public.techniques enable row level security;
alter table public.user_techniques enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.notifications enable row level security;
alter table public.email_deliveries enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.training_records to authenticated;
grant select, insert, update, delete on public.game_plans to authenticated;
grant select, insert, update, delete on public.free_notes to authenticated;
grant select, insert, update on public.training_schedules to authenticated;
grant select, insert, update on public.review_schedules to authenticated;
grant select, insert, update on public.email_preferences to authenticated;
grant select on public.federation_sources to anon, authenticated;
grant select on public.competitions to anon, authenticated;
grant select, insert, update, delete on public.competition_alerts to authenticated;
grant select on public.techniques to anon, authenticated;
grant select, insert, update, delete on public.user_techniques to authenticated;
grant select on public.subscription_plans to anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select, update on public.notifications to authenticated;

create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy training_records_select_own on public.training_records
for select to authenticated using ((select auth.uid()) = user_id);
create policy training_records_insert_own on public.training_records
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy training_records_update_own on public.training_records
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy training_records_delete_own on public.training_records
for delete to authenticated using ((select auth.uid()) = user_id);

create policy game_plans_select_own on public.game_plans
for select to authenticated using ((select auth.uid()) = user_id);
create policy game_plans_insert_own on public.game_plans
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy game_plans_update_own on public.game_plans
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy game_plans_delete_own on public.game_plans
for delete to authenticated using ((select auth.uid()) = user_id);

create policy free_notes_select_own on public.free_notes
for select to authenticated using ((select auth.uid()) = user_id);
create policy free_notes_insert_own on public.free_notes
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy free_notes_update_own on public.free_notes
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy free_notes_delete_own on public.free_notes
for delete to authenticated using ((select auth.uid()) = user_id);

create policy training_schedules_select_own on public.training_schedules
for select to authenticated using ((select auth.uid()) = user_id);
create policy training_schedules_insert_own on public.training_schedules
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy training_schedules_update_own on public.training_schedules
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy review_schedules_select_own on public.review_schedules
for select to authenticated using ((select auth.uid()) = user_id);
create policy review_schedules_insert_own on public.review_schedules
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy review_schedules_update_own on public.review_schedules
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy email_preferences_select_own on public.email_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy email_preferences_insert_own on public.email_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy email_preferences_update_own on public.email_preferences
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy federation_sources_public_read on public.federation_sources
for select to anon, authenticated using (true);

create policy competitions_read_published on public.competitions
for select to anon, authenticated using (published);

create policy competition_alerts_select_own on public.competition_alerts
for select to authenticated using ((select auth.uid()) = user_id);
create policy competition_alerts_insert_own on public.competition_alerts
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy competition_alerts_update_own on public.competition_alerts
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy competition_alerts_delete_own on public.competition_alerts
for delete to authenticated using ((select auth.uid()) = user_id);

create policy techniques_read_published on public.techniques
for select to anon, authenticated using (published);

create policy user_techniques_select_own on public.user_techniques
for select to authenticated using ((select auth.uid()) = user_id);
create policy user_techniques_insert_own on public.user_techniques
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_techniques_update_own on public.user_techniques
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy user_techniques_delete_own on public.user_techniques
for delete to authenticated using ((select auth.uid()) = user_id);

create policy subscription_plans_read_active on public.subscription_plans
for select to anon, authenticated using (active);
create policy subscriptions_select_own on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);

create policy notifications_select_own on public.notifications
for select to authenticated using ((select auth.uid()) = user_id);
create policy notifications_update_own on public.notifications
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read on storage.objects
for select to anon, authenticated using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects
for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy avatars_update_own on storage.objects
for update to authenticated using (
  bucket_id = 'avatars' and owner_id = (select auth.uid())::text
) with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy avatars_delete_own on storage.objects
for delete to authenticated using (
  bucket_id = 'avatars' and owner_id = (select auth.uid())::text
);

insert into public.subscription_plans (id, name, description, price_cents, interval, pro_access)
values
  ('free', 'Gratuito', 'Diário, calendário, plano de jogo e notas.', 0, 'free', false),
  ('pro_monthly', 'Pró Mensal', 'Biblioteca, competições e revisões por e-mail.', 2000, 'month', true),
  ('founder_lifetime', 'Fundador Vitalício', 'Acesso vitalício aos recursos Pró.', 15000, 'lifetime', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  interval = excluded.interval,
  pro_access = excluded.pro_access,
  active = true;

insert into public.techniques (slug, name, classification, description, is_pro, sort_order)
values
  ('uchi-mata', 'Uchi-mata', 'Ashi-waza', 'Técnica de perna com controle de pegada, kuzushi e rotação do tronco.', false, 10),
  ('seoi-nage', 'Seoi-nage', 'Te-waza', 'Projeção de braço que exige entrada próxima, postura e direção do kuzushi.', false, 20),
  ('o-soto-gari', 'O-soto-gari', 'Ashi-waza', 'Grande varrida externa com desequilíbrio para trás e controle do tronco.', true, 30),
  ('harai-goshi', 'Harai-goshi', 'Koshi-waza', 'Técnica de quadril combinada a uma ação ampla da perna.', true, 40),
  ('sumi-gaeshi', 'Sumi-gaeshi', 'Sutemi-waza', 'Sacrifício para trás usando a perna para elevar e girar o uke.', true, 50),
  ('juji-gatame', 'Juji-gatame', 'Kansetsu-waza', 'Chave de braço aplicada com controle do ombro, punho e quadril.', true, 60)
on conflict (slug) do update set
  name = excluded.name,
  classification = excluded.classification,
  description = excluded.description,
  is_pro = excluded.is_pro,
  sort_order = excluded.sort_order,
  published = true;

insert into public.competitions (
  slug, name, starts_on, ends_on, place, status, description, categories,
  source_url, source_label, source_checked_at
)
values
  (
    'inter-regional-aspirante-2026', 'Campeonato Inter-regional Aspirante',
    '2026-09-19', '2026-09-20', 'Etapas por delegacia regional', 'scheduled',
    'Etapas inter-regionais da Divisão Aspirante. O local depende da delegacia regional do atleta.',
    'Divisão Aspirante · Consulte sua delegacia',
    'https://fpj.com.br/wp-content/uploads/2026/09/Proposta-Calendario-FPJUDO-2026-V9.pdf',
    'Calendário Geral FPJUDO 2026 · V9', '2026-09-13T12:00:00-03:00'
  ),
  (
    'trofeu-brasil-junior-2026', 'CBI: Troféu Brasil de Judô — Júnior',
    '2026-09-24', '2026-09-27', null, 'scheduled',
    'Competição Brasileira Interclubes individual e por equipes incluída no calendário da FPJUDO.',
    'Júnior · Individual e equipes',
    'https://fpj.com.br/wp-content/uploads/2026/09/Proposta-Calendario-FPJUDO-2026-V9.pdf',
    'Calendário Geral FPJUDO 2026 · V9', '2026-09-13T12:00:00-03:00'
  ),
  (
    'paulista-aspirante-2026', 'Campeonato Paulista Aspirante',
    '2026-09-26', '2026-09-26', 'Ginásio Neusa Galetti · Marília/SP', 'details_published',
    'Fase estadual da Divisão Aspirante no Ginásio Neusa Galetti, Marília/SP.',
    'Sub-9 ao Adulto, exceto Sub-13',
    'https://fpj.com.br/campeonato-paulista-aspirante-de-judo-2026/',
    'Comunicado oficial FPJUDO', '2026-09-13T12:00:00-03:00'
  ),
  (
    'seletiva-meeting-2026', 'Seletiva Meeting de Santa Catarina',
    '2026-10-24', '2026-10-24', null, 'scheduled',
    'Seletiva estadual prevista pela FPJUDO; programação detalhada a confirmar.',
    'Categorias a confirmar pela FPJUDO',
    'https://fpj.com.br/wp-content/uploads/2026/09/Proposta-Calendario-FPJUDO-2026-V9.pdf',
    'Calendário Geral FPJUDO 2026 · V9', '2026-09-13T12:00:00-03:00'
  )
on conflict (slug) do update set
  name = excluded.name,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  place = excluded.place,
  status = excluded.status,
  description = excluded.description,
  categories = excluded.categories,
  source_url = excluded.source_url,
  source_label = excluded.source_label,
  source_checked_at = excluded.source_checked_at,
  published = true;
