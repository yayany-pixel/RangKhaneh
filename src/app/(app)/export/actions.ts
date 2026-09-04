"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthedContext } from "@/lib/auth/session";
import {
  parseArchive,
  planImport,
  buildImportRecords,
  type ImportPlan,
  type ImportStrategy,
} from "@/lib/export/importer";
import { KEYED_TABLES, type KeyedTable } from "@/lib/export/schema";

export type ImportState = {
  ok: boolean;
  message?: string;
  errors?: string[];
  plan?: ImportPlan;
  applied?: boolean;
};

const CONFLICT_TARGET: Record<string, string> = {
  card_facets: "card_id,facet_id",
  card_tags: "card_id,tag_id",
  collection_cards: "collection_id,card_id",
};

async function readArchiveFile(file: File): Promise<unknown> {
  const isZip =
    file.name.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";
  if (isZip) {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file("data.json");
    if (!entry) throw new Error("Archive ZIP has no data.json");
    return JSON.parse(await entry.async("string"));
  }
  return JSON.parse(await file.text());
}

export async function importArchiveAction(
  _prev: ImportState | null,
  formData: FormData,
): Promise<ImportState> {
  const { supabase, user } = await getAuthedContext();
  const file = formData.get("file");
  const strategy = (formData.get("strategy") as ImportStrategy) ?? "skip";
  const apply = formData.get("intent") === "apply";

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errors: ["Choose an archive .json or .zip file."] };
  }

  let raw: unknown;
  try {
    raw = await readArchiveFile(file);
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : "Could not read the file."],
    };
  }

  const parsed = parseArchive(raw);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const archive = parsed.archive;

  const existingByTable: Partial<Record<KeyedTable, Set<string>>> = {};
  await Promise.all(
    KEYED_TABLES.map(async (table) => {
      const { data } = await supabase.from(table).select("id");
      existingByTable[table] = new Set((data ?? []).map((r) => r.id as string));
    }),
  );

  const plan = planImport(archive, existingByTable, strategy);

  if (!apply) {
    return {
      ok: true,
      plan,
      message: `Dry run: ${plan.totals.incoming} record(s) would be processed.`,
    };
  }

  const operations = buildImportRecords(
    archive,
    existingByTable,
    strategy,
    user.id,
    randomUUID,
  );

  for (const op of operations) {
    if (!op.rows.length) continue;
    let rows = op.rows;
    if (op.table === "book_sections") {
      // Insert roots before children to satisfy the self-referential FK.
      rows = [...rows].sort((a, b) => {
        const ap = a.parent_id ? 1 : 0;
        const bp = b.parent_id ? 1 : 0;
        return ap - bp;
      });
    }
    const onConflict = CONFLICT_TARGET[op.table] ?? "id";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(op.table as any) as any).upsert(rows, {
      onConflict,
    });
    if (error) {
      return {
        ok: false,
        errors: [`Failed writing ${op.table}: ${error.message}`],
        plan,
      };
    }
  }

  revalidatePath("/archive");
  revalidatePath("/home");
  return {
    ok: true,
    applied: true,
    plan,
    message: `Import complete using "${strategy}" strategy.`,
  };
}
