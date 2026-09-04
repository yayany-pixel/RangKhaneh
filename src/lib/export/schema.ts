import { z } from "zod";

/**
 * Archive format version. Bump when the shape changes in a breaking way; the
 * importer validates this before doing anything.
 */
export const ARCHIVE_SCHEMA_VERSION = 1;

/** A record carrying a UUID primary key. */
const keyed = z.object({ id: z.string().uuid() }).passthrough();
/** A join record with a composite key (no single `id`). */
const joinRecord = z.record(z.unknown());

export const archiveSchema = z.object({
  manifest: z.object({
    app: z.string(),
    schema_version: z.number().int(),
    exported_at: z.string(),
    counts: z.record(z.number()).optional(),
  }),
  cards: z.array(keyed).default([]),
  sources: z.array(keyed).default([]),
  facets: z.array(keyed).default([]),
  facet_aliases: z.array(keyed).default([]),
  card_facets: z.array(joinRecord).default([]),
  tags: z.array(keyed).default([]),
  card_tags: z.array(joinRecord).default([]),
  attachments: z.array(keyed).default([]),
  collections: z.array(keyed).default([]),
  collection_cards: z.array(joinRecord).default([]),
  book_constitutions: z.array(keyed).default([]),
  book_sections: z.array(keyed).default([]),
  card_book_links: z.array(keyed).default([]),
  collision_reports: z.array(keyed).default([]),
  card_relations: z.array(keyed).default([]),
});

export type Archive = z.infer<typeof archiveSchema>;

/** Tables whose rows carry a single `id` primary key, in FK-safe import order. */
export const KEYED_TABLES = [
  "sources",
  "facets",
  "tags",
  "collections",
  "book_constitutions",
  "book_sections",
  "cards",
  "attachments",
  "card_book_links",
  "collision_reports",
  "card_relations",
  "facet_aliases",
] as const;

export type KeyedTable = (typeof KEYED_TABLES)[number];
