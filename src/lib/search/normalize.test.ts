import { describe, it, expect } from "vitest";
import { normalizeForSearch, normalizeTag, queryTerms } from "./normalize";

describe("normalizeForSearch", () => {
  it("returns empty string for nullish input", () => {
    expect(normalizeForSearch(null)).toBe("");
    expect(normalizeForSearch(undefined)).toBe("");
    expect(normalizeForSearch("")).toBe("");
  });

  it("lowercases Latin text", () => {
    expect(normalizeForSearch("QeRMeZ")).toBe("qermez");
    expect(normalizeForSearch("Ghermez QERMEZ")).toBe("ghermez qermez");
  });

  it("folds Arabic kaf to Persian kaf", () => {
    // كتاب (Arabic kaf) -> کتاب (Persian kaf)
    expect(normalizeForSearch("\u0643\u062A\u0627\u0628")).toBe(
      normalizeForSearch("\u06A9\u062A\u0627\u0628"),
    );
  });

  it("folds Arabic yeh and alef maksura to Persian yeh", () => {
    // علي (Arabic yeh) and علی (Persian yeh) should match
    expect(normalizeForSearch("\u0639\u0644\u064A")).toBe(
      normalizeForSearch("\u0639\u0644\u06CC"),
    );
    // على (alef maksura)
    expect(normalizeForSearch("\u0639\u0644\u0649")).toBe(
      normalizeForSearch("\u0639\u0644\u06CC"),
    );
  });

  it("removes tatweel", () => {
    // کـــتاب -> کتاب
    expect(normalizeForSearch("\u06A9\u0640\u0640\u0640\u062A\u0627\u0628")).toBe(
      "\u06A9\u062A\u0627\u0628",
    );
  });

  it("removes ZWNJ so joined and non-joined forms match", () => {
    // می‌رود (with ZWNJ) -> میرود
    expect(normalizeForSearch("\u0645\u06CC\u200C\u0631\u0648\u062F")).toBe(
      "\u0645\u06CC\u0631\u0648\u062F",
    );
  });

  it("folds Arabic-Indic and Persian digits to ASCII", () => {
    expect(normalizeForSearch("\u06F1\u06F2\u06F3")).toBe("123"); // ۱۲۳
    expect(normalizeForSearch("\u0664\u0665")).toBe("45"); // ٤٥
  });

  it("removes Arabic diacritics", () => {
    // کَتاب (fatha on kaf) -> کتاب
    expect(normalizeForSearch("\u06A9\u064E\u062A\u0627\u0628")).toBe(
      "\u06A9\u062A\u0627\u0628",
    );
  });

  it("collapses whitespace and trims", () => {
    expect(normalizeForSearch("  a\t\n  b   c ")).toBe("a b c");
  });

  it("keeps mixed Persian and Latin content", () => {
    const value = normalizeForSearch("سبز sabz");
    expect(value).toContain("sabz");
    expect(value).toContain("\u0633\u0628\u0632");
  });
});

describe("normalizeTag", () => {
  it("normalizes for de-duplication", () => {
    // Arabic vs Persian yeh spellings collapse to the same tag
    expect(normalizeTag("\u0642\u0631\u0645\u0632")).toBe(
      normalizeForSearch("\u0642\u0631\u0645\u0632"),
    );
  });
});

describe("queryTerms", () => {
  it("splits into unique terms", () => {
    expect(queryTerms("sabz sabz green")).toEqual(["sabz", "green"]);
  });

  it("returns empty array for empty query", () => {
    expect(queryTerms("   ")).toEqual([]);
  });
});
