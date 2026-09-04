# Search

Phase 1 provides fast **keyword** and **fuzzy** search with no external search
service — only PostgreSQL. The design keeps a clean seam so semantic/hybrid
search can be added in Phase 3 without a UI rewrite (`SearchService` in
`src/lib/search/service.ts`).

## The golden rule

**The original text is never modified.** Search operates on a _separate,
normalized copy_. Displayed characters — Persian spelling, ZWNJ, diacritics —
are always preserved exactly as captured.

## Normalization

`normalizeForSearch()` in `src/lib/search/normalize.ts` produces the searchable
form. It is mirrored **exactly** by the SQL function `public.search_normalize()`
in `0001_init.sql`, so a query normalized in the app matches text normalized in
the database. Steps:

- Lowercase Latin text.
- Fold Arabic → Persian character variants: kaf `ك→ک`, yeh `ي→ی`, alef maksura
  `ى→ی`.
- Fold Arabic-Indic and Persian digits to ASCII (`٠..٩`, `۰..۹` → `0..9`).
- Remove tatweel (`ـ`), bidi controls (LRM/RLM/BOM), ZWNJ/ZWJ, and the optional
  Arabic harakat/diacritics.
- Collapse repeated whitespace.

Unit tests: `src/lib/search/normalize.test.ts`.

## Index representation

Cards maintain two trigger-built columns (never displayed):

- `search_all` — normalized aggregate of the card's own searchable fields
  (title, all content/annotation/translation fields, historical date label),
  the linked source's metadata, and — via child triggers — tags, facets (labels
  **and** aliases), and attachment extracted text.
- `search_tsv` — a `tsvector` (`to_tsvector('simple', search_all)`).

Triggers:

- `cards_build_search` (BEFORE INSERT/UPDATE on `cards`) rebuilds `search_all`
  and `search_tsv`, incorporating the child-derived `search_related`.
- `card_tags` / `card_facets` / `attachments` triggers recompute the parent
  card's `search_related`, which re-fires the card trigger.

Indexes (`0001_init.sql`):

- `gin (search_tsv)` — full-text keyword search.
- `gin (search_all gin_trgm_ops)` via `pg_trgm` — fuzzy / typo-tolerant search.

## Query flow

`queryCards()` (`src/lib/data/cards.ts`) normalizes the query, then combines
full-text matching with trigram similarity so that both exact and fuzzy hits
surface. Because aliases are folded into `search_all`, a card classified with
the `سبز` facet is found by `sabz` and `sabzi`; manual `facet_aliases` extend
this to spelling variants such as `qermez` / `ghermez` / `قرمز`. Matching terms
are highlighted in results (`queryTerms()` + the card list renderer).

## Filters & URL state

Search and filters are GET-based and URL-backed (`/archive?...`), so any search
is shareable and bookmarkable. Supported filters: domain, card type, workflow
status, epistemic status, book relation, source, tag, facet, collection,
section, "needs source/verification/review", pinned, has-attachment, and sort.

## Extension points (later phases)

- `SearchService` is an interface; `keywordSearchService` is the Phase-1
  implementation. A future `hybridSearchService` can add embeddings/semantic
  ranking behind the same interface.
- Saved searches and semantic search are Phase 2/3 items; the normalized column +
  service seam mean they slot in without changing result rendering.
