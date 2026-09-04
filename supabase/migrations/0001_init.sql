-- ===========================================================================
-- Rangkhaneh — initial schema
-- Normalized tables, UUID PKs, ownership, enums, search functions/triggers,
-- and indexes. RLS is applied in 0002_rls.sql; storage in 0003_storage.sql.
-- ===========================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;     -- fuzzy / trigram search

-- ---------------------------------------------------------------------------
-- Enums (stable state machines). New values can be added safely later with
-- `ALTER TYPE ... ADD VALUE`. `card_type`, `source_type`, `facet_type` etc.
-- are stored as TEXT and validated in the app so they can be extended without
-- a schema migration (see docs/decisions.md).
-- ---------------------------------------------------------------------------
create type card_domain as enum ('research', 'creative', 'personal', 'manuscript');

create type workflow_status as enum (
  'inbox', 'processing', 'processed', 'collision_tested', 'connected',
  'book_candidate', 'used_in_book', 'independent_value', 'dormant', 'archived'
);

create type epistemic_status as enum (
  'not_applicable', 'unreviewed', 'sourced', 'verified', 'plausible',
  'uncertain', 'disputed', 'speculative'
);

create type book_relation as enum (
  'untested', 'central', 'supports', 'complicates', 'contradicts', 'extends',
  'reframes', 'illustrates', 'inspires', 'context_only', 'independent_value',
  'no_current_fit'
);

create type date_precision as enum (
  'unknown', 'exact', 'year', 'decade', 'century', 'period', 'range'
);

create type calendar_system as enum (
  'gregorian', 'hijri_solar', 'hijri_lunar', 'other'
);

create type card_relation_type as enum (
  'supports', 'contradicts', 'complicates', 'extends', 'reframes', 'quotes',
  'responds_to', 'derived_from', 'same_source', 'same_object', 'same_term',
  'same_period', 'same_place', 'same_motif', 'possible_sequence', 'related'
);

create type book_node_type as enum ('project', 'part', 'chapter', 'section');

create type card_book_use_status as enum ('proposed', 'drafted', 'used', 'rejected');

create type collision_authorship as enum ('manual', 'ai_assisted', 'ai_generated');

create type collision_status as enum ('draft', 'complete');

create type collision_verdict as enum (
  'use', 'hold', 'reject', 'independent', 'needs_more'
);

create type extraction_status as enum ('none', 'pending', 'done', 'failed');

-- ---------------------------------------------------------------------------
-- Shared helper functions
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Persian/Arabic aware normalization used for the searchable copy AND for
-- normalizing incoming queries. Mirrors src/lib/search/normalize.ts exactly.
-- IMPORTANT: never used to change the *displayed* original text.
create or replace function public.search_normalize(input text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(
        regexp_replace(
          -- 3) remove tatweel, ZWNJ/ZWJ, bidi marks, BOM, and Arabic diacritics
          translate(
            -- 2) unify character variants + digits (Arabic/Persian -> Latin)
            translate(
              lower(coalesce(input, '')),
              -- from: Arabic kaf, Arabic yeh, alef maksura, arabic-indic digits,
              --       extended (persian) digits
              chr(1603) || chr(1610) || chr(1609)
                || chr(1632) || chr(1633) || chr(1634) || chr(1635) || chr(1636)
                || chr(1637) || chr(1638) || chr(1639) || chr(1640) || chr(1641)
                || chr(1776) || chr(1777) || chr(1778) || chr(1779) || chr(1780)
                || chr(1781) || chr(1782) || chr(1783) || chr(1784) || chr(1785),
              -- to: Persian kaf, Persian yeh, Persian yeh, then 0-9 twice
              chr(1705) || chr(1740) || chr(1740)
                || '0123456789'
                || '0123456789'
            ),
            -- remove set (mapped to nothing): tatweel, ZWNJ, ZWJ, LRM, RLM, BOM,
            -- and the Arabic harakat + superscript alef
            chr(1600) || chr(8204) || chr(8205) || chr(8206) || chr(8207)
              || chr(65279)
              || chr(1611) || chr(1612) || chr(1613) || chr(1614) || chr(1615)
              || chr(1616) || chr(1617) || chr(1618) || chr(1648),
            ''
          ),
          -- 4) collapse whitespace
          '\s+', ' ', 'g'
        )
      ),
      ''
    ),
    ''
  );
$$;

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  source_type text not null default 'other',
  author text,
  publication text,
  publisher text,
  url text,
  archive text,
  identifier text,
  identifier_type text,
  publication_date_label text,
  access_date date,
  rights_status text,
  reliability_note text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sources_owner_idx on public.sources (owner_id);
create trigger sources_set_updated_at
  before update on public.sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cards (the fundamental object)
-- ---------------------------------------------------------------------------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  title text not null default '',
  domain card_domain not null default 'research',
  card_type text not null default 'research_note',
  workflow_status workflow_status not null default 'inbox',
  epistemic_status epistemic_status not null default 'unreviewed',
  book_relation book_relation not null default 'untested',

  -- Content: original is preserved separately from every derived field.
  original_content text not null default '',
  working_content text,
  exact_quote text,
  paraphrase text,
  translation text,
  transliteration text,
  summary text,
  annotation text,
  questions text,
  why_it_matters text,

  -- Language
  language_codes text[] not null default '{}',
  original_language text,
  translation_language text,

  -- Source / provenance
  source_id uuid references public.sources (id) on delete set null,
  source_locator text,
  provenance_note text,
  rights_status text,
  reliability_note text,

  -- Historical dating (kept separate from capture timestamps)
  historical_date_label text,
  historical_start_year integer,
  historical_end_year integer,
  date_precision date_precision not null default 'unknown',
  calendar_system calendar_system not null default 'gregorian',

  -- Optional color swatches, explicitly labeled as visual references.
  color_swatches jsonb not null default '[]'::jsonb,

  is_favorite boolean not null default false,

  captured_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  -- Searchable representations (never displayed; maintained by triggers).
  search_related text not null default '',
  search_all text not null default '',
  search_tsv tsvector
);
create index cards_owner_idx on public.cards (owner_id);
create index cards_workflow_idx on public.cards (owner_id, workflow_status);
create index cards_domain_idx on public.cards (owner_id, domain);
create index cards_book_relation_idx on public.cards (owner_id, book_relation);
create index cards_source_idx on public.cards (source_id);
create index cards_deleted_idx on public.cards (deleted_at);
create index cards_next_review_idx on public.cards (owner_id, next_review_at);
create index cards_search_tsv_idx on public.cards using gin (search_tsv);
create index cards_search_trgm_idx on public.cards using gin (search_all gin_trgm_ops);

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- facets (controlled vocabulary) + aliases
-- ---------------------------------------------------------------------------
create table public.facets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  facet_type text not null default 'custom',
  label_en text,
  label_fa text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facets_label_present check (
    coalesce(label_en, '') <> '' or coalesce(label_fa, '') <> ''
  )
);
create index facets_owner_idx on public.facets (owner_id);
create index facets_type_idx on public.facets (owner_id, facet_type);
create trigger facets_set_updated_at
  before update on public.facets
  for each row execute function public.set_updated_at();

create table public.facet_aliases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  facet_id uuid not null references public.facets (id) on delete cascade,
  alias text not null,
  created_at timestamptz not null default now()
);
create index facet_aliases_facet_idx on public.facet_aliases (facet_id);
create unique index facet_aliases_unique on public.facet_aliases (facet_id, alias);

create table public.card_facets (
  card_id uuid not null references public.cards (id) on delete cascade,
  facet_id uuid not null references public.facets (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  primary key (card_id, facet_id)
);
create index card_facets_facet_idx on public.card_facets (facet_id);
create index card_facets_owner_idx on public.card_facets (owner_id);

-- ---------------------------------------------------------------------------
-- tags (free-form) + link
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null,
  normalized text not null default '',
  created_at timestamptz not null default now()
);
create unique index tags_owner_normalized_unique on public.tags (owner_id, normalized);
create index tags_owner_idx on public.tags (owner_id);

create table public.card_tags (
  card_id uuid not null references public.cards (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, tag_id)
);
create index card_tags_tag_idx on public.card_tags (tag_id);
create index card_tags_owner_idx on public.card_tags (owner_id);

-- ---------------------------------------------------------------------------
-- attachments (files live in a private bucket; original is preserved)
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  kind text not null default 'other',
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  byte_size bigint,
  checksum text,
  caption text,
  extracted_text text,
  extraction_status extraction_status not null default 'none',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attachments_card_idx on public.attachments (card_id);
create index attachments_owner_idx on public.attachments (owner_id);
create trigger attachments_set_updated_at
  before update on public.attachments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- collections + ordered membership
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index collections_owner_idx on public.collections (owner_id);
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_cards (
  collection_id uuid not null references public.collections (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  primary key (collection_id, card_id)
);
create index collection_cards_card_idx on public.collection_cards (card_id);
create index collection_cards_order_idx on public.collection_cards (collection_id, position);
create index collection_cards_owner_idx on public.collection_cards (owner_id);

-- ---------------------------------------------------------------------------
-- book constitutions (versioned; old versions preserved)
-- ---------------------------------------------------------------------------
create table public.book_constitutions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version_name text not null,
  is_current boolean not null default false,
  project_description text,
  central_questions text,
  provisional_thesis text,
  counter_theses text,
  accepted_claims text,
  rejected_claims text,
  methodology text,
  ethics text,
  tone text,
  chapter_outline text,
  glossary text,
  known_problems text,
  body_markdown text,
  revision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index book_constitutions_owner_idx on public.book_constitutions (owner_id);
-- At most one current constitution per owner.
create unique index book_constitutions_one_current
  on public.book_constitutions (owner_id)
  where is_current;
create trigger book_constitutions_set_updated_at
  before update on public.book_constitutions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- book map (hierarchical outline)
-- ---------------------------------------------------------------------------
create table public.book_sections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id uuid references public.book_sections (id) on delete cascade,
  node_type book_node_type not null default 'section',
  title text not null,
  summary text,
  position integer not null default 0,
  constitution_id uuid references public.book_constitutions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index book_sections_owner_idx on public.book_sections (owner_id);
create index book_sections_parent_idx on public.book_sections (parent_id, position);
create trigger book_sections_set_updated_at
  before update on public.book_sections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- card <-> book section links (a card may link to many sections)
-- ---------------------------------------------------------------------------
create table public.card_book_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  section_id uuid not null references public.book_sections (id) on delete cascade,
  book_relation book_relation not null default 'untested',
  intended_use text,
  priority integer not null default 0,
  rationale text,
  citation_note text,
  excerpt_used text,
  use_status card_book_use_status not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, section_id)
);
create index card_book_links_card_idx on public.card_book_links (card_id);
create index card_book_links_section_idx on public.card_book_links (section_id);
create index card_book_links_owner_idx on public.card_book_links (owner_id);
create trigger card_book_links_set_updated_at
  before update on public.card_book_links
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- collision reports (tied to a specific constitution version)
-- ---------------------------------------------------------------------------
create table public.collision_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  constitution_id uuid references public.book_constitutions (id) on delete set null,
  authorship collision_authorship not null default 'manual',
  status collision_status not null default 'draft',

  what_it_says text,
  extracted_units text,
  evidence_vs_interpretation text,
  missing_verification text,
  agreements text,
  contradictions text,
  complications text,
  forcing_risk text,
  possible_uses text,
  placement_suggestions text,
  independent_uses text,
  verification_tasks text,
  related_card_queries text,
  warnings text,
  confidence integer,

  verdict collision_verdict,
  human_rationale text,

  -- AI provenance (Phase 2). AI content is always labeled and never overwrites
  -- human fields.
  ai_suggestion jsonb,
  ai_status text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index collision_reports_card_idx on public.collision_reports (card_id);
create index collision_reports_constitution_idx on public.collision_reports (constitution_id);
create index collision_reports_owner_idx on public.collision_reports (owner_id);
create trigger collision_reports_set_updated_at
  before update on public.collision_reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- typed directional relationships between cards
-- ---------------------------------------------------------------------------
create table public.card_relations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_card_id uuid not null references public.cards (id) on delete cascade,
  to_card_id uuid not null references public.cards (id) on delete cascade,
  relation_type card_relation_type not null default 'related',
  note text,
  created_at timestamptz not null default now(),
  constraint card_relations_no_self check (from_card_id <> to_card_id),
  unique (from_card_id, to_card_id, relation_type)
);
create index card_relations_from_idx on public.card_relations (from_card_id);
create index card_relations_to_idx on public.card_relations (to_card_id);
create index card_relations_owner_idx on public.card_relations (owner_id);

-- ---------------------------------------------------------------------------
-- card revisions (version history + restore)
-- ---------------------------------------------------------------------------
create table public.card_revisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  snapshot jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);
create index card_revisions_card_idx on public.card_revisions (card_id, created_at desc);
create index card_revisions_owner_idx on public.card_revisions (owner_id);

-- ---------------------------------------------------------------------------
-- per-user settings
-- ---------------------------------------------------------------------------
create table public.user_settings (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  ai_enabled boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  last_export_at timestamptz,
  last_export_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Search maintenance
-- ===========================================================================

-- Recompute the card's own normalized text + source contribution and combine
-- with the child-derived `search_related` column. Runs on the card row itself.
create or replace function public.cards_build_search()
returns trigger
language plpgsql
as $$
declare
  own text;
  src text := '';
begin
  own := public.search_normalize(
    concat_ws(' ',
      new.title, new.original_content, new.working_content, new.exact_quote,
      new.paraphrase, new.translation, new.transliteration, new.summary,
      new.annotation, new.questions, new.why_it_matters, new.provenance_note,
      new.reliability_note, new.source_locator, new.historical_date_label,
      array_to_string(new.language_codes, ' ')
    )
  );

  if new.source_id is not null then
    select public.search_normalize(
      concat_ws(' ', s.title, s.author, s.publication, s.publisher)
    )
    into src
    from public.sources s
    where s.id = new.source_id;
  end if;

  new.search_all := trim(concat_ws(' ', own, coalesce(src, ''), new.search_related));
  new.search_tsv := to_tsvector('simple', new.search_all);
  return new;
end;
$$;

create trigger cards_build_search_trg
  before insert or update on public.cards
  for each row execute function public.cards_build_search();

-- When related rows (tags, facets, attachments) change, recompute the parent
-- card's `search_related`, which re-fires the card BEFORE UPDATE trigger above.
create or replace function public.cards_refresh_related(p_card_id uuid)
returns void
language plpgsql
as $$
declare
  rel text;
begin
  select public.search_normalize(concat_ws(' ',
    (select string_agg(t.label, ' ')
       from public.card_tags ct join public.tags t on t.id = ct.tag_id
      where ct.card_id = p_card_id),
    (select string_agg(concat_ws(' ', f.label_en, f.label_fa), ' ')
       from public.card_facets cf join public.facets f on f.id = cf.facet_id
      where cf.card_id = p_card_id),
    (select string_agg(concat_ws(' ', a.caption, a.extracted_text, a.original_filename), ' ')
       from public.attachments a
      where a.card_id = p_card_id)
  )) into rel;

  update public.cards
     set search_related = coalesce(rel, '')
   where id = p_card_id;
end;
$$;

create or replace function public.cards_related_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.cards_refresh_related(old.card_id);
    return old;
  else
    perform public.cards_refresh_related(new.card_id);
    return new;
  end if;
end;
$$;

create trigger card_tags_refresh_search
  after insert or delete on public.card_tags
  for each row execute function public.cards_related_changed();

create trigger card_facets_refresh_search
  after insert or update or delete on public.card_facets
  for each row execute function public.cards_related_changed();

create trigger attachments_refresh_search
  after insert or update or delete on public.attachments
  for each row execute function public.cards_related_changed();

-- ===========================================================================
-- Card revision snapshots: capture the OLD content when meaningful fields
-- change, so history + restore are always available.
-- ===========================================================================
create or replace function public.cards_snapshot_revision()
returns trigger
language plpgsql
as $$
begin
  if (
    old.title is distinct from new.title or
    old.original_content is distinct from new.original_content or
    old.working_content is distinct from new.working_content or
    old.exact_quote is distinct from new.exact_quote or
    old.paraphrase is distinct from new.paraphrase or
    old.translation is distinct from new.translation or
    old.transliteration is distinct from new.transliteration or
    old.summary is distinct from new.summary or
    old.annotation is distinct from new.annotation or
    old.questions is distinct from new.questions or
    old.why_it_matters is distinct from new.why_it_matters or
    old.domain is distinct from new.domain or
    old.card_type is distinct from new.card_type or
    old.workflow_status is distinct from new.workflow_status or
    old.epistemic_status is distinct from new.epistemic_status or
    old.book_relation is distinct from new.book_relation
  ) then
    insert into public.card_revisions (owner_id, card_id, snapshot, reason)
    values (
      old.owner_id,
      old.id,
      jsonb_build_object(
        'title', old.title,
        'domain', old.domain,
        'card_type', old.card_type,
        'workflow_status', old.workflow_status,
        'epistemic_status', old.epistemic_status,
        'book_relation', old.book_relation,
        'original_content', old.original_content,
        'working_content', old.working_content,
        'exact_quote', old.exact_quote,
        'paraphrase', old.paraphrase,
        'translation', old.translation,
        'transliteration', old.transliteration,
        'summary', old.summary,
        'annotation', old.annotation,
        'questions', old.questions,
        'why_it_matters', old.why_it_matters,
        'updated_at', old.updated_at
      ),
      'auto'
    );
  end if;
  return new;
end;
$$;

create trigger cards_snapshot_revision_trg
  before update on public.cards
  for each row execute function public.cards_snapshot_revision();
