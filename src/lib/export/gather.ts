import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ARCHIVE_SCHEMA_VERSION, type Archive } from "@/lib/export/schema";
import {
  cardToMarkdown,
  cardFilename,
  toCsv,
  CARD_CSV_COLUMNS,
  type ExportCard,
} from "@/lib/export/serialize";

type Client = SupabaseClient<Database>;

async function rows<T = Record<string, unknown>>(
  supabase: Client,
  table: string,
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from(table as any).select("*") as any);
  return (data ?? []) as T[];
}

/** Query every owner-scoped table and assemble the archive JSON object. */
export async function gatherArchive(supabase: Client): Promise<Archive> {
  const [
    cards,
    sources,
    facets,
    facet_aliases,
    card_facets,
    tags,
    card_tags,
    attachments,
    collections,
    collection_cards,
    book_constitutions,
    book_sections,
    card_book_links,
    collision_reports,
    card_relations,
  ] = await Promise.all([
    rows(supabase, "cards"),
    rows(supabase, "sources"),
    rows(supabase, "facets"),
    rows(supabase, "facet_aliases"),
    rows(supabase, "card_facets"),
    rows(supabase, "tags"),
    rows(supabase, "card_tags"),
    rows(supabase, "attachments"),
    rows(supabase, "collections"),
    rows(supabase, "collection_cards"),
    rows(supabase, "book_constitutions"),
    rows(supabase, "book_sections"),
    rows(supabase, "card_book_links"),
    rows(supabase, "collision_reports"),
    rows(supabase, "card_relations"),
  ]);

  const archive = {
    manifest: {
      app: "rangkhaneh",
      schema_version: ARCHIVE_SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      counts: {
        cards: cards.length,
        sources: sources.length,
        facets: facets.length,
        tags: tags.length,
        attachments: attachments.length,
        collections: collections.length,
        book_constitutions: book_constitutions.length,
        book_sections: book_sections.length,
        collision_reports: collision_reports.length,
      },
    },
    cards,
    sources,
    facets,
    facet_aliases,
    card_facets,
    tags,
    card_tags,
    attachments,
    collections,
    collection_cards,
    book_constitutions,
    book_sections,
    card_book_links,
    collision_reports,
    card_relations,
  } as unknown as Archive;

  return archive;
}

/**
 * Build a full-archive ZIP: structured JSON, Markdown card files, a CSV of card
 * metadata, and the original attachment files fetched from private storage.
 */
export async function buildArchiveZip(
  supabase: Client,
  archive: Archive,
): Promise<Uint8Array> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(archive.manifest, null, 2));
  zip.file("data.json", JSON.stringify(archive, null, 2));
  zip.file(
    "README.txt",
    [
      "Rangkhaneh archive export",
      `Schema version: ${archive.manifest.schema_version}`,
      `Exported: ${archive.manifest.exported_at}`,
      "",
      "data.json          Structured data for all records (re-importable).",
      "cards/*.md         One Markdown file per card (human-readable).",
      "cards.csv          Card metadata as a spreadsheet.",
      "attachments/*      Original attachment files, preserved as uploaded.",
      "",
      "This archive is yours. It re-imports into Rangkhaneh and is also readable",
      "without it.",
      "",
    ].join("\n"),
  );

  const cards = archive.cards as unknown as ExportCard[];
  const cardsFolder = zip.folder("cards");
  for (const card of cards) {
    cardsFolder?.file(cardFilename(card), cardToMarkdown(card));
  }
  zip.file(
    "cards.csv",
    toCsv(cards as unknown as Record<string, unknown>[], CARD_CSV_COLUMNS),
  );

  const attachmentsFolder = zip.folder("attachments");
  for (const att of archive.attachments as unknown as {
    storage_path: string;
    original_filename: string;
  }[]) {
    if (!att.storage_path) continue;
    const { data, error } = await supabase.storage
      .from("attachments")
      .download(att.storage_path);
    if (error || !data) continue;
    const buffer = new Uint8Array(await data.arrayBuffer());
    attachmentsFolder?.file(att.storage_path, buffer);
  }

  return zip.generateAsync({ type: "uint8array" });
}
