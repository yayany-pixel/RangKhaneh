# Security model

Rangkhaneh is a **private, single-user** product. There is no public content and
no public signup. Authentication is the real security boundary; everything else
is defense in depth.

## Authentication & authorization

- **Supabase Auth** with email + password. The owner account is created
  manually in the Supabase dashboard — there is **no registration screen**.
- **Email allowlist** from the server-only `AUTH_ALLOWLIST` env var
  (`src/lib/auth/allowlist.ts`). The allowlist is checked:
  1. before attempting sign-in (`src/app/(auth)/login/actions.ts`), and
  2. again server-side on every authed request via `getAuthedContext()`
     (`src/lib/auth/session.ts`), which redirects unauthorized or disallowed
     users. An authenticated user whose email later leaves the allowlist loses
     access immediately.
- **Protected layout + middleware.** The `(app)` route group requires a session;
  `src/middleware.ts` refreshes the Supabase session cookie and gates routes.
- **Every mutation is a server action or route handler** that re-derives the
  user from the session server-side and sets/checks `owner_id`. The browser
  never asserts its own identity.

## Row Level Security

- `owner_id` is present on **every** user-owned table.
- `0002_rls.sql` runs `enable row level security` on every exposed table and
  adds `select/insert/update/delete` policies of the form
  `owner_id = auth.uid()`. RLS is the backstop: even if an application check is
  missed, Postgres refuses cross-owner reads and writes.
- Because this is single-user, RLS primarily protects against bugs and against
  the anon key being used directly.

## Storage

- Attachments live in a **private** bucket (`0003_storage.sql`), never public.
- Object paths are **owner-scoped**: `<uid>/<card_id>/<filename>`. Storage
  policies check `(storage.foldername(name))[1] = auth.uid()::text`, so a user
  can only read/write objects under their own prefix.
- Downloads go through `/api/attachments/[id]`, which verifies ownership of the
  attachment row and then issues a **short-lived signed URL** (60s). There are
  no long-lived or public object URLs.

## Secrets

- The **service-role key is never imported into client code**. It is used only
  by `src/lib/supabase/admin.ts`, which throws if run in a browser, and only by
  the seed script. The browser sees only the anon key.
- `.env*` is gitignored except `.env.example`, which contains **no real
  secrets**.

## Web hardening

- `noindex` metadata (`src/app/layout.tsx`) plus a `robots.txt`
  (`src/app/robots.ts`) that disallows all crawlers. These reduce accidental
  exposure but are **not** the security boundary — auth is.
- **No third-party analytics or trackers.**
- Rich-text/Markdown is rendered as escaped content; user text containers use
  `dir="auto"` rather than injecting raw HTML.
- Mutations run as POST server actions tied to the session cookie
  (`SameSite=Lax`), giving CSRF-safe patterns with server-side authorization on
  every call.
- Destructive actions require confirmation and use **soft delete** (Trash +
  restore) rather than immediate hard deletes.

## AI processing

- AI is **disabled by default** (`user_settings.ai_enabled = false`).
- Phase 1 ships only a **manual** `AnalysisProvider`
  (`src/lib/analysis/provider.ts`): it can build a copyable prompt and parse a
  pasted suggestion, but makes **no network calls**.
- No attachment or card content is ever sent to an AI provider without a
  deliberate user action. AI-produced text is always labelled and never
  overwrites human content.

## Threats explicitly considered

| Threat                         | Mitigation                                                          |
| ------------------------------ | ------------------------------------------------------------------- |
| Anonymous access to data       | Middleware + `getAuthedContext()` redirect; RLS denies the anon key |
| Disallowed authenticated user  | Allowlist re-checked server-side on every request                   |
| Cross-owner data access        | `owner_id` + RLS on every table                                     |
| Leaked attachment URL          | Signed URLs expire in 60s; bucket is private                        |
| Service-role key exposure      | Server-only import guard; never a `NEXT_PUBLIC_` var                |
| Accidental deletion            | Confirmation + soft delete + restore                                |
| Search index leaking originals | Search columns are normalized copies, never displayed               |
| Crawler indexing               | `noindex` + `robots.txt` (defense in depth)                         |
