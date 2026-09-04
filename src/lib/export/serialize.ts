/**
 * Pure serialization helpers (no I/O, no Supabase, no jszip) so they can be
 * unit-tested and reused by any export route.
 */

export type ExportCard = {
  id: string;
  title: string | null;
  domain?: string | null;
  card_type?: string | null;
  workflow_status?: string | null;
  epistemic_status?: string | null;
  book_relation?: string | null;
  original_content?: string | null;
  working_content?: string | null;
  exact_quote?: string | null;
  paraphrase?: string | null;
  translation?: string | null;
  transliteration?: string | null;
  summary?: string | null;
  annotation?: string | null;
  questions?: string | null;
  why_it_matters?: string | null;
  language_codes?: string[] | null;
  historical_date_label?: string | null;
  captured_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export function slugify(input: string | null | undefined, fallback = "card"): string {
  const base = (input ?? "").trim();
  if (!base) return fallback;
  const slug = base
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}

export function cardFilename(card: ExportCard): string {
  return `${slugify(card.title)}-${card.id.slice(0, 8)}.md`;
}

function frontmatter(card: ExportCard): string {
  const lines = ["---", `id: ${card.id}`, `title: ${JSON.stringify(card.title ?? "")}`];
  if (card.domain) lines.push(`domain: ${card.domain}`);
  if (card.card_type) lines.push(`type: ${card.card_type}`);
  if (card.workflow_status) lines.push(`workflow_status: ${card.workflow_status}`);
  if (card.epistemic_status) lines.push(`epistemic_status: ${card.epistemic_status}`);
  if (card.book_relation) lines.push(`book_relation: ${card.book_relation}`);
  if (card.language_codes && card.language_codes.length) {
    lines.push(`languages: [${card.language_codes.join(", ")}]`);
  }
  if (card.captured_at) lines.push(`captured_at: ${card.captured_at}`);
  lines.push("---");
  return lines.join("\n");
}

function section(heading: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "";
  return `\n## ${heading}\n\n${value}\n`;
}

export function cardToMarkdown(card: ExportCard): string {
  const parts = [
    frontmatter(card),
    `\n# ${card.title || "Untitled card"}\n`,
    section("Original content", card.original_content),
    section("Exact quotation", card.exact_quote),
    section("Working content", card.working_content),
    section("Paraphrase", card.paraphrase),
    section("Translation", card.translation),
    section("Transliteration", card.transliteration),
    section("Summary", card.summary),
    section("Annotation", card.annotation),
    section("Questions raised", card.questions),
    section("Why this card matters", card.why_it_matters),
    section("Historical date", card.historical_date_label),
  ];
  return parts.filter(Boolean).join("").trimStart() + "\n";
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text: string;
  if (Array.isArray(value)) text = value.join("; ");
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(csvCell).join(",");
  const body = rows.map((row) => columns.map((col) => csvCell(row[col])).join(","));
  return [header, ...body].join("\r\n") + "\r\n";
}

export const CARD_CSV_COLUMNS = [
  "id",
  "title",
  "domain",
  "card_type",
  "workflow_status",
  "epistemic_status",
  "book_relation",
  "language_codes",
  "historical_date_label",
  "captured_at",
  "created_at",
];

/** A collection exported as an ordered Markdown dossier. */
export function collectionToMarkdown(
  collection: { title: string; description: string | null },
  cards: ExportCard[],
): string {
  const head = [`# ${collection.title}\n`];
  if (collection.description) head.push(`${collection.description}\n`);
  const body = cards.map((c, i) => {
    const bits = [
      `\n## ${i + 1}. ${c.title || "Untitled card"}\n`,
      typeof c.original_content === "string" && c.original_content.trim()
        ? `${c.original_content}\n`
        : "",
    ];
    return bits.filter(Boolean).join("");
  });
  return head.join("") + body.join("") + "\n";
}
