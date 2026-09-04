# Implementation Plan

Phase 1 ("The Cabinet") is implemented in vertical slices. Each slice keeps the
project green under `lint`, `typecheck`, `test`, and `build`.

## Architecture

```
src/
  app/                     # Next.js App Router
    (auth)/login/          # public login (no signup)
    (app)/                 # protected layout + nav
      home/                # dashboard
      inbox/               # focused review queue
      archive/             # search + filters + card list
      cards/[id]/          # three-layer card detail
      capture/             # mobile quick capture
      collections/         # collections CRUD + ordering
      sources/             # sources CRUD
      book/                # constitution + book map
      export/              # export/import + backup status
      settings/            # facets, tags, aliases, AI toggle, account
    api/                   # route handlers (export downloads, signed URLs)
  components/              # reusable UI primitives + feature components
  lib/
    supabase/              # server, browser, middleware clients + types
    auth/                  # allowlist + session helpers
    search/                # Persian normalization + query building
    validation/            # Zod schemas (shared client/server)
    export/                # serializers (md/csv/json/zip)
    constants/             # enums + controlled vocab labels (fa/en)
    analysis/              # AnalysisProvider interface + manual provider
supabase/
  migrations/              # checked-in SQL migrations (schema + RLS + storage)
scripts/
  seed.ts                  # removable dev seed
tests/ (co-located *.test.ts + e2e/)
```

## Data layer

Typed Supabase access (no ORM). Server Components and Server Actions read/write
through `@supabase/ssr` clients bound to the request cookies. All mutations run on
the server and re-check the authenticated user + allowlist. Row Level Security is
the real authorization boundary (see `security-model.md`).

## Slice order (delivered)

1. Scaffold + tooling.
2. Docs.
3. Migrations: enums, `sources`, `cards`, `facets`, `card_facets`, `tags`,
   `card_tags`, `attachments`, `collections`, `collection_cards`,
   `book_constitutions`, `book_sections`, `card_book_links`, `collision_reports`,
   `card_relations`, `card_revisions`, `facet_aliases`, `settings`; RLS on all;
   `search_normalize()` + generated tsvector + pg_trgm indexes; storage policies.
4. Core libs: supabase clients, allowlist, Persian normalization (+tests),
   Zod schemas (+tests), constants.
5. Auth + protected layout + middleware.
6. Cards CRUD + Quick Capture + three-layer detail + inbox + trash/restore +
   revisions.
7. Sources / facets / tags / collections / attachments.
8. Search + filters + URL state + highlight.
9. Book Constitution + Collision Reports + Book Map + card-book links.
10. Export/import (+tests) + seed.
11. e2e specs + final verification.

## Extension points (Phase 2/3 without rewrite)

- `lib/analysis/provider.ts` `AnalysisProvider` interface: Phase 1 ships only a
  `ManualProvider`. A future `OpenAIProvider`/`AnthropicProvider` plugs in behind
  the same interface; AI output is always labeled and stored in separate fields.
- `lib/search/service.ts` `SearchService` interface: Phase 1 ships a
  `KeywordSearchService` (Postgres FTS + trigram). A future
  `HybridSearchService` (embeddings) plugs in without UI changes.
- URL metadata extraction, OCR, and audio transcription are represented by status
  columns (`extraction_status`) and left as no-ops in Phase 1.

## Verification

Run in order: `npm run lint && npm run typecheck && npm run test && npm run build`.
E2E (`npm run test:e2e`) requires a live Supabase project and an allowlisted test
user; see `README.md`.
