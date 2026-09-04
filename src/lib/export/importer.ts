import {
  archiveSchema,
  ARCHIVE_SCHEMA_VERSION,
  KEYED_TABLES,
  type Archive,
  type KeyedTable,
} from "@/lib/export/schema";

export type ImportStrategy = "skip" | "overwrite" | "copy";

export type ParseResult =
  | { ok: true; archive: Archive }
  | { ok: false; errors: string[] };

/** Validate an unknown value as an archive and check its schema version. */
export function parseArchive(raw: unknown): ParseResult {
  const result = archiveSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
    };
  }
  const version = result.data.manifest.schema_version;
  if (version !== ARCHIVE_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        `Unsupported archive schema version ${version}; this app expects ${ARCHIVE_SCHEMA_VERSION}.`,
      ],
    };
  }
  return { ok: true, archive: result.data };
}

export type TablePlan = {
  incoming: number;
  conflicts: number;
  willCreate: number;
  willOverwrite: number;
  willCopy: number;
  willSkip: number;
};

export type ImportPlan = {
  strategy: ImportStrategy;
  tables: Record<string, TablePlan>;
  totals: TablePlan;
};

const emptyPlan = (): TablePlan => ({
  incoming: 0,
  conflicts: 0,
  willCreate: 0,
  willOverwrite: 0,
  willCopy: 0,
  willSkip: 0,
});

/**
 * Produce a dry-run plan describing what an import would do, given the set of
 * ids that already exist for each keyed table.
 */
export function planImport(
  archive: Archive,
  existingIds: Partial<Record<KeyedTable, Set<string>>>,
  strategy: ImportStrategy,
): ImportPlan {
  const tables: Record<string, TablePlan> = {};
  const totals = emptyPlan();

  for (const table of KEYED_TABLES) {
    const rows = (archive[table] ?? []) as { id: string }[];
    const existing = existingIds[table] ?? new Set<string>();
    const plan = emptyPlan();
    for (const row of rows) {
      plan.incoming += 1;
      const conflict = existing.has(row.id);
      if (!conflict) {
        plan.willCreate += 1;
        continue;
      }
      plan.conflicts += 1;
      if (strategy === "skip") plan.willSkip += 1;
      else if (strategy === "overwrite") plan.willOverwrite += 1;
      else plan.willCopy += 1;
    }
    tables[table] = plan;
    totals.incoming += plan.incoming;
    totals.conflicts += plan.conflicts;
    totals.willCreate += plan.willCreate;
    totals.willOverwrite += plan.willOverwrite;
    totals.willCopy += plan.willCopy;
    totals.willSkip += plan.willSkip;
  }

  return { strategy, tables, totals };
}

/** Foreign-key columns per table → the keyed table they reference. */
const FK: Record<string, Record<string, KeyedTable>> = {
  cards: { source_id: "sources" },
  attachments: { card_id: "cards" },
  book_sections: { parent_id: "book_sections", constitution_id: "book_constitutions" },
  card_book_links: { card_id: "cards", section_id: "book_sections" },
  collision_reports: { card_id: "cards", constitution_id: "book_constitutions" },
  card_relations: { from_card_id: "cards", to_card_id: "cards" },
  facet_aliases: { facet_id: "facets" },
  card_facets: { card_id: "cards", facet_id: "facets" },
  card_tags: { card_id: "cards", tag_id: "tags" },
  collection_cards: { collection_id: "collections", card_id: "cards" },
};

/** Join tables with a composite key (no single `id`). */
export const JOIN_TABLES = ["card_facets", "card_tags", "collection_cards"] as const;

export type ImportOperation = {
  table: string;
  rows: Record<string, unknown>[];
};

/**
 * Pure transform: given an archive, the ids that already exist, and a strategy,
 * produce the exact rows to write (owner forced, ids/FKs remapped for `copy`,
 * conflicting rows dropped for `skip`). No I/O — unit-testable.
 */
export function buildImportRecords(
  archive: Archive,
  existingByTable: Partial<Record<KeyedTable, Set<string>>>,
  strategy: ImportStrategy,
  ownerId: string,
  genId: () => string,
): ImportOperation[] {
  const idMap: Record<string, Map<string, string>> = {};
  const dropped: Record<string, Set<string>> = {};

  for (const table of KEYED_TABLES) {
    idMap[table] = new Map();
    dropped[table] = new Set();
    const existing = existingByTable[table] ?? new Set<string>();
    for (const row of (archive[table] ?? []) as { id: string }[]) {
      if (strategy === "skip" && existing.has(row.id)) {
        dropped[table].add(row.id);
        continue;
      }
      if (strategy === "copy" && existing.has(row.id)) {
        idMap[table].set(row.id, genId());
      } else {
        idMap[table].set(row.id, row.id);
      }
    }
  }

  const isDropped = (table: string, id: string) => dropped[table]?.has(id) ?? false;
  const mapId = (table: string, id: string) => idMap[table]?.get(id) ?? id;

  const remapFks = (
    table: string,
    row: Record<string, unknown>,
  ): Record<string, unknown> | null => {
    const fks = FK[table];
    if (!fks) return row;
    const next = { ...row };
    for (const [col, ref] of Object.entries(fks)) {
      const value = next[col];
      if (typeof value !== "string") continue;
      if (isDropped(ref, value)) return null;
      next[col] = mapId(ref, value);
    }
    return next;
  };

  const operations: ImportOperation[] = [];

  for (const table of KEYED_TABLES) {
    const rows: Record<string, unknown>[] = [];
    for (const raw of (archive[table] ?? []) as Record<string, unknown>[]) {
      const id = raw.id as string;
      if (isDropped(table, id)) continue;
      const remapped = remapFks(table, {
        ...raw,
        id: mapId(table, id),
        owner_id: ownerId,
      });
      if (remapped) rows.push(remapped);
    }
    operations.push({ table, rows });
  }

  for (const table of JOIN_TABLES) {
    const rows: Record<string, unknown>[] = [];
    for (const raw of (archive[table] ?? []) as Record<string, unknown>[]) {
      const fks = FK[table];
      let ok = true;
      const next: Record<string, unknown> = { ...raw, owner_id: ownerId };
      for (const [col, ref] of Object.entries(fks)) {
        const value = next[col];
        if (typeof value !== "string" || isDropped(ref, value)) {
          ok = false;
          break;
        }
        next[col] = mapId(ref, value);
      }
      if (ok) rows.push(next);
    }
    operations.push({ table, rows });
  }

  return operations;
}
