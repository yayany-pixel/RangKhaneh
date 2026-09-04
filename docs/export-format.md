# Export & import format

> "The archive must not become a prison." Everything is exportable in open,
> re-importable formats, with original attachments preserved.

Code: `src/lib/export/` (`schema.ts`, `serialize.ts`, `gather.ts`,
`importer.ts`) and the routes under `src/app/api/export/` and
`src/app/(app)/export/`.

## What you can export

| Export                     | Route                                      | Contents                                                                                               |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Full archive (ZIP)         | `/api/export`                              | manifest, schema version, structured JSON, per-card Markdown, cards CSV, and original attachment files |
| Cards → Markdown           | `/api/export/cards?format=markdown`        | one `.md` per card (concatenated)                                                                      |
| Cards → CSV                | `/api/export/cards?format=csv`             | card metadata table                                                                                    |
| Cards → JSON               | `/api/export/cards?format=json`            | card records                                                                                           |
| Collection → Markdown/JSON | `/collections/[id]/export?format=md\|json` | cards in their **manual order**                                                                        |

Each full export updates `user_settings.last_export_at`, surfaced on the
Export/Backup page and the dashboard as a backup-status indicator.

## ZIP layout

```
manifest.json          app name, schema_version, exported_at, row counts
data.json              the full structured archive (see below)
README.txt             human note describing the archive
cards.csv              metadata for every card
cards/<slug>-<id8>.md  one Markdown file per card (human-readable)
attachments/<path>     original files, fetched from private storage
```

Filenames are human-readable **plus** a stable id fragment
(`slugify(title)-<first 8 of uuid>`), so files are recognizable while UUIDs keep
them unambiguous. `slugify` preserves Unicode letters (Persian titles stay
legible).

## `data.json` shape

Validated by `archiveSchema` (Zod) in `schema.ts`:

```jsonc
{
  "manifest": { "app": "rangkhaneh", "schema_version": 1, "exported_at": "…", "counts": { … } },
  "cards": [ { "id": "uuid", … } ],
  "sources": [ … ], "facets": [ … ], "facet_aliases": [ … ],
  "card_facets": [ … ], "tags": [ … ], "card_tags": [ … ],
  "attachments": [ … ], "collections": [ … ], "collection_cards": [ … ],
  "book_constitutions": [ … ], "book_sections": [ … ],
  "card_book_links": [ … ], "collision_reports": [ … ], "card_relations": [ … ]
}
```

`ARCHIVE_SCHEMA_VERSION` is `1`. Keyed tables (single `id` PK) are listed in
**FK-safe order** in `KEYED_TABLES`; join tables (`card_facets`, `card_tags`,
`collection_cards`) have composite keys.

## Import

Import is a validated, previewable, conflict-aware operation
(`/export` page → `importArchiveAction`). Pure logic lives in `importer.ts` and
is unit-tested (`importer.test.ts`).

1. **Read** a `.json` archive or a `.zip` (its `data.json` is extracted).
2. **Validate** with Zod and check `schema_version` (`parseArchive`). Malformed
   input or a version mismatch aborts with readable errors.
3. **Dry run** (`planImport`) reports, per table: incoming, conflicts, and how
   many rows would be created / overwritten / copied / skipped — shown before
   anything is written.
4. **Apply** (`buildImportRecords`) with a conflict strategy:
   - `skip` — keep existing rows; drop incoming duplicates (and any rows whose
     foreign key pointed at a skipped row, to avoid FK violations).
   - `overwrite` — upsert incoming rows over existing ids.
   - `copy` — assign **new UUIDs** to conflicting rows and **remap foreign keys**
     so the copied graph stays internally consistent.
5. Rows are written in FK-safe table order; `book_sections` are sorted so roots
   precede children (self-referential `parent_id`). `owner_id` is always forced
   to the importing user.

## Round-trip integrity

`serialize.test.ts` and `importer.test.ts` cover Markdown/CSV serialization and
the import remap/skip/copy logic, including foreign-key remapping and join-table
handling, so an export → import round-trip preserves structure on a small
fixture archive.
