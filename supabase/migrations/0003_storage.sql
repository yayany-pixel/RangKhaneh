-- ===========================================================================
-- Rangkhaneh — private attachment storage
-- A single private bucket. Objects are namespaced by owner id as the first path
-- segment ("<uid>/<card_id>/<file>"), and RLS on storage.objects enforces that
-- only the owner can read/write their files. Access from the app is always via
-- short-lived signed URLs.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Read own files.
create policy "attachments read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Upload into own namespace.
create policy "attachments insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update own files.
create policy "attachments update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete own files.
create policy "attachments delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
