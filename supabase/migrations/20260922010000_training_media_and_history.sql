alter table public.training_records
  add column if not exists media_path text,
  add column if not exists media_type text;

create index if not exists training_records_user_date_idx
  on public.training_records(user_id, training_date desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'training-media',
  'training-media',
  false,
  52428800,
  array['image/*', 'video/*']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists training_media_select_own on storage.objects;
create policy training_media_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'training-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists training_media_insert_own on storage.objects;
create policy training_media_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'training-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists training_media_delete_own on storage.objects;
create policy training_media_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'training-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
