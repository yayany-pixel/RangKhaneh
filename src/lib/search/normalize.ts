// ---------------------------------------------------------------------------
// Persian / Arabic aware search normalization.
//
// This produces a *separate* searchable copy of text. It is never used to
// change what the user sees — the original characters are always preserved.
//
// This MUST stay in sync with the SQL function public.search_normalize()
// in supabase/migrations/0001_init.sql. Both implement the same steps so that
// a query normalized in the app matches text normalized in the database.
// ---------------------------------------------------------------------------

// Single-character variant folds (Arabic -> Persian).
const CHAR_MAP: Record<string, string> = {
  "\u0643": "\u06A9", // Arabic kaf ك -> Persian kaf ک
  "\u064A": "\u06CC", // Arabic yeh ي -> Persian yeh ی
  "\u0649": "\u06CC", // Alef maksura ى -> Persian yeh ی
};

// Arabic-Indic (U+0660–0669) and extended/Persian (U+06F0–06F9) digits -> ASCII.
for (let i = 0; i < 10; i++) {
  CHAR_MAP[String.fromCharCode(0x0660 + i)] = String(i);
  CHAR_MAP[String.fromCharCode(0x06f0 + i)] = String(i);
}

// Characters removed entirely for matching purposes.
const STRIP = new Set<string>([
  "\u0640", // tatweel ـ
  "\u200C", // ZWNJ
  "\u200D", // ZWJ
  "\u200E", // LRM
  "\u200F", // RLM
  "\uFEFF", // BOM / ZWNBSP
  // Arabic harakat (diacritics) U+064B–U+0652
  "\u064B",
  "\u064C",
  "\u064D",
  "\u064E",
  "\u064F",
  "\u0650",
  "\u0651",
  "\u0652",
  "\u0670", // superscript alef
]);

/**
 * Normalize text into its searchable form.
 * Lowercases Latin, folds Persian/Arabic variants and digits, removes tatweel,
 * bidi controls, ZWNJ/ZWJ and diacritics, and collapses whitespace.
 */
export function normalizeForSearch(input: string | null | undefined): string {
  if (!input) return "";
  const lowered = input.toLowerCase();
  let out = "";
  for (const ch of lowered) {
    if (STRIP.has(ch)) continue;
    out += CHAR_MAP[ch] ?? ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Normalize a free tag for de-duplication (same rules as search).
 */
export function normalizeTag(input: string): string {
  return normalizeForSearch(input);
}

/**
 * Split a normalized query into distinct terms.
 */
export function queryTerms(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  return Array.from(new Set(normalized.split(" ").filter(Boolean)));
}
