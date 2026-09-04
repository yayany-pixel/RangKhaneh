-- ===========================================================================
-- Rangkhaneh — Row Level Security
-- Every table is owner-scoped. RLS is the real authorization boundary: a row is
-- only visible/mutable by the authenticated user whose id matches owner_id.
-- ===========================================================================

alter table public.sources            enable row level security;
alter table public.cards              enable row level security;
alter table public.facets             enable row level security;
alter table public.facet_aliases      enable row level security;
alter table public.card_facets        enable row level security;
alter table public.tags               enable row level security;
alter table public.card_tags          enable row level security;
alter table public.attachments        enable row level security;
alter table public.collections        enable row level security;
alter table public.collection_cards   enable row level security;
alter table public.book_constitutions enable row level security;
alter table public.book_sections      enable row level security;
alter table public.card_book_links    enable row level security;
alter table public.collision_reports  enable row level security;
alter table public.card_relations     enable row level security;
alter table public.card_revisions     enable row level security;
alter table public.user_settings      enable row level security;

-- One uniform owner policy per table. `to authenticated` blocks the anon role
-- entirely; the `owner_id = auth.uid()` predicate enforces per-user isolation.
create policy owner_all on public.sources
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.cards
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.facets
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.facet_aliases
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.card_facets
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.tags
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.card_tags
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.attachments
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.collections
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.collection_cards
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.book_constitutions
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.book_sections
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.card_book_links
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.collision_reports
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.card_relations
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.card_revisions
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy owner_all on public.user_settings
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
