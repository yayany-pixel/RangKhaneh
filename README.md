# Rangkhaneh / رنگ‌خانه

A private, single-user **research archive and writing laboratory** for the
evolving book project _Colors of Iran_. It is deliberately three things at once:

- an **Archive** of source material and creative fragments, with provenance;
- a **Workshop** for testing new material against the current argument of the
  book (the _Collision Test_ against a versioned _Book Constitution_);
- a **Book Map** connecting cards to possible manuscript chapters — without
  requiring that every card be used.

The fundamental object is a **Card**. A card can remain independently valuable
even if it never enters the book. Original material is never overwritten by a
summary, translation, OCR result, or interpretation.

> This repository implements **Phase 1 ("The Cabinet")**. The schema and
> interfaces are designed so Phases 2 (AI-assisted workshop) and 3 (semantic
> search, atlas) can be added without a rewrite. See
> [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (Postgres, Auth, private Storage) · Zod · React Hook Form ·
Vitest · Playwright · ESLint · Prettier.

Explicit SQL migrations and typed Supabase access — no ORM.

## Product purpose

See the full brief in [`docs/product-brief.md`](docs/product-brief.md). Core
principles: capture first / organize later; preserve rejected ideas; separate
quotation from paraphrase from interpretation from invention; treat uncertainty
as information; Persian and English work equally well (mixed RTL/LTR); every
important action is reversible or versioned; the archive is always exportable.

## Local setup

Requirements: Node 20+, npm, and a Supabase project (hosted or local CLI).

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable                                              | Scope  | Purpose                                                                                     |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                            | public | Supabase project URL                                                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                       | public | Supabase anon/publishable key                                                               |
| `AUTH_ALLOWLIST`                                      | server | Comma-separated emails allowed to sign in. **The only way in — there is no public signup.** |
| `SUPABASE_SERVICE_ROLE_KEY`                           | server | Used only by admin scripts (seeding). Never imported into client code.                      |
| `SUPABASE_ATTACHMENTS_BUCKET`                         | server | Private bucket name (default `attachments`).                                                |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_ID`                  | server | Which user the dev seed belongs to.                                                         |
| `E2E_BASE_URL`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` | server | Playwright config.                                                                          |

`.env.example` documents every variable; never commit real secrets.

## Supabase project setup

1. **Create a project** at [supabase.com](https://supabase.com) (or run the
   [Supabase CLI](https://supabase.com/docs/guides/cli) locally).
2. **Apply migrations** (order matters):

   ```bash
   # Using the Supabase CLI against a linked project:
   supabase db push

   # …or run each file in the SQL editor, in order:
   #   supabase/migrations/0001_init.sql     schema, enums, search functions
   #   supabase/migrations/0002_rls.sql      Row Level Security on every table
   #   supabase/migrations/0003_storage.sql  private bucket + storage policies
   ```

3. **Authentication allowlist.** There is no sign-up screen. Create the owner
   user in **Auth → Users** (email + password), then add that email to
   `AUTH_ALLOWLIST`. Sign-in is refused for any address not on the list, and
   again server-side after Supabase authenticates.
4. **Private storage.** `0003_storage.sql` creates a **private** bucket named
   `attachments` with owner-scoped RLS (`<uid>/<card_id>/<file>`). Files are
   served only through short-lived **signed URLs** via `/api/attachments/[id]`;
   there are no public object URLs.
5. **Generate types** (optional, when you change the schema):

   ```bash
   npm run db:types   # supabase gen types … > src/lib/supabase/database.types.ts
   ```

## Seed data (optional, removable)

The seed inserts clearly-labelled **EXAMPLE** data (a سبز/`sabz` linguistic
note, a naming counterargument, a poem fragment, a _Working Constitution 0.1_,
and a _Naming Problems_ collection). Every record uses a fixed UUID so it can be
removed cleanly.

```bash
npm run seed            # insert/refresh example data
npm run seed -- --clean # remove it
```

Requires `SUPABASE_SERVICE_ROLE_KEY` and `SEED_OWNER_EMAIL` (or `SEED_OWNER_ID`).

## Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the dev server                     |
| `npm run build`     | Production build                         |
| `npm run start`     | Serve the production build               |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | `tsc --noEmit` (strict)                  |
| `npm run test`      | Vitest unit tests                        |
| `npm run test:e2e`  | Playwright end-to-end tests              |
| `npm run format`    | Prettier write                           |
| `npm run db:types`  | Regenerate Supabase types                |
| `npm run seed`      | Insert dev seed (`-- --clean` to remove) |

## Running tests

**Unit tests** need no services:

```bash
npm run test
```

They cover Persian search normalization, card/import/collision/constitution
validation, and export serialization round-trips.

**End-to-end tests** need a live app + Supabase project and an allowlisted user:

```bash
# In .env.local: E2E_TEST_EMAIL / E2E_TEST_PASSWORD (an allowlisted user)
npm run build && npm run start   # or let Playwright start it for you
npm run test:e2e
```

The suite logs in, quick-captures a Persian card, processes it, creates a
source and a Book Constitution, completes a Collision Report, links the card to
the book, searches by a transliteration variant, adds it to a collection,
exports the archive, and soft-deletes then restores the card. A separate spec
verifies that anonymous and disallowed users cannot reach data or attachments.
Specs skip automatically when credentials are absent.

## Deployment (private web app)

Deploy as a standard hosted Next.js app (e.g. Vercel):

1. Create the Supabase project and apply migrations (above).
2. Set all environment variables in the host's project settings. Keep
   `SUPABASE_SERVICE_ROLE_KEY` **server-only** (never a `NEXT_PUBLIC_` var).
3. Deploy. The app sends `noindex` metadata and a `robots.txt` that disallows
   all crawlers — but **authentication is the real security boundary**.
4. It installs as a PWA (see `src/app/manifest.ts`) for fast mobile capture;
   offline sync is intentionally out of scope for Phase 1.

## Documentation

- [`docs/product-brief.md`](docs/product-brief.md) — the full product brief.
- [`docs/implementation-plan.md`](docs/implementation-plan.md) — phases & slices.
- [`docs/data-model.md`](docs/data-model.md) — tables, relationships, ER diagram.
- [`docs/security-model.md`](docs/security-model.md) — auth, RLS, storage, threats.
- [`docs/search.md`](docs/search.md) — Persian normalization & search design.
- [`docs/export-format.md`](docs/export-format.md) — archive format & import rules.
- [`docs/decisions.md`](docs/decisions.md) — recorded assumptions & trade-offs.

## Privacy

Single-user and private by design: mandatory auth, no public signup, email
allowlist, `owner_id` on every row, RLS on every exposed table, private storage
with signed URLs, no service-role key in the browser, no third-party analytics.
AI processing is **disabled by default**; nothing is ever sent to an AI provider
without a deliberate user action (Phase 2).
