# Decisions & assumptions

Per the brief, reasonable assumptions are recorded here rather than blocking on
minor questions. Newest entries are appended.

## Stack & architecture

- **No ORM.** Explicit SQL migrations + typed Supabase access, as instructed.
  `src/lib/supabase/database.types.ts` is the single typed contract.
- **Tailwind CSS v4** with a CSS-first config and hand-rolled accessible UI
  primitives (`src/components/ui/*`). shadcn/ui was not vendored wholesale to
  avoid dependency clutter for a small, bespoke surface; the primitives follow
  the same accessible patterns.
- **Controlled vocab split.** Structurally fixed values are Postgres enums;
  values expected to grow (card/source/facet types, rights, relation types, use
  statuses, verdicts, attachment kinds) are `text` validated in the app, so the
  vocabulary is editable without a risky enum migration.

## Authentication

- **Email + password** via Supabase Auth (not magic links) for a deterministic,
  scriptable single-user login and reliable e2e. The owner is created manually;
  there is no signup screen. The allowlist is enforced both before sign-in and
  again server-side on every request.

## AI (Phase 2 seam only in Phase 1)

- Only a **manual `AnalysisProvider`** ships now. It builds a copyable,
  provider-neutral prompt and can parse a pasted suggestion, but makes **no
  network calls**. `user_settings.ai_enabled` defaults to `false`. AI text is
  always labelled and never overwrites human fields.

## Search

- Phase 1 uses **Postgres only** (`tsvector` + `pg_trgm`). The app-side
  `normalizeForSearch()` and SQL `search_normalize()` are kept byte-for-byte
  equivalent and covered by tests. A `SearchService` interface reserves space
  for semantic/hybrid search later without touching result rendering.

## Dates

- Historical dates are **not** forced into JS `Date`. They are stored as a
  human label plus optional start/end years, a precision, and a calendar system,
  kept separate from capture timestamps.

## Export/import

- Archive `schema_version = 1`. Import is validate → dry-run → apply, with
  `skip` / `overwrite` / `copy` strategies. `copy` remaps UUIDs and foreign keys
  so a duplicated graph stays consistent. Pure logic is unit-tested.

## Environment constraint during initial build

- **No live Supabase or Docker was available in the build environment.** The
  verification gates used were `lint`, `typecheck`, `test` (Vitest), and a
  production `build` — all green. Because of this:
  - `database.types.ts` is **hand-authored** to match the migrations (regenerate
    with `npm run db:types` against a real project when convenient).
  - Playwright specs are authored against the real UI but **skip automatically**
    unless `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` are set and a server + Supabase
    project are available. They are meant to run against a live deployment.
  - The production build was run with placeholder `NEXT_PUBLIC_*` values; pages
    that read cookies are dynamic and are not prerendered, so no real backend is
    contacted at build time.

## Seed

- Dev seed uses **fixed UUIDs** and an owner resolved from `SEED_OWNER_EMAIL`
  (or `SEED_OWNER_ID`) via the service-role admin client. All records are marked
  EXAMPLE and removable with `npm run seed -- --clean`.

## PWA

- A minimal web manifest (`src/app/manifest.ts`) + an SVG icon make the app
  installable for fast mobile capture. Offline sync is intentionally **out of
  scope** for Phase 1 to avoid destabilizing the MVP.

## Attachments

- Files stay in a private bucket; downloads use 60-second signed URLs via a
  route that checks row ownership first. Extracted text (OCR/transcription) is
  stored **separately** from the original file; automatic OCR is not run in
  Phase 1 (manual transcription is supported).
