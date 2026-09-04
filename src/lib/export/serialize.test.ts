import { describe, it, expect } from "vitest";
import {
  slugify,
  cardFilename,
  cardToMarkdown,
  toCsv,
  collectionToMarkdown,
  CARD_CSV_COLUMNS,
  type ExportCard,
} from "@/lib/export/serialize";

const card: ExportCard = {
  id: "abcdef12-0000-4000-8000-000000000000",
  title: "سبز، sabz, and sabzi",
  domain: "research",
  card_type: "linguistic_note",
  original_content: "سبز means green.",
  annotation: "An open question.",
  language_codes: ["fa", "en"],
  captured_at: "2024-01-01T00:00:00.000Z",
};

describe("slugify", () => {
  it("keeps Unicode letters and collapses separators", () => {
    expect(slugify("Safavid Reds!")).toBe("safavid-reds");
  });

  it("preserves Persian letters rather than stripping them", () => {
    expect(slugify("سبز رنگ")).toBe("سبز-رنگ");
  });

  it("falls back when there is nothing usable", () => {
    expect(slugify("   ")).toBe("card");
    expect(slugify("!!!", "note")).toBe("note");
  });
});

describe("cardFilename", () => {
  it("combines a slug with a short id and .md", () => {
    expect(cardFilename(card)).toBe("سبز-sabz-and-sabzi-abcdef12.md");
  });
});

describe("cardToMarkdown", () => {
  const md = cardToMarkdown(card);

  it("includes frontmatter with the stable id", () => {
    expect(md.startsWith("---")).toBe(true);
    expect(md).toContain(`id: ${card.id}`);
  });

  it("preserves the original Persian content verbatim", () => {
    expect(md).toContain("## Original content");
    expect(md).toContain("سبز means green.");
  });

  it("omits empty sections", () => {
    expect(md).not.toContain("## Translation");
  });
});

describe("toCsv", () => {
  it("emits a header plus one row per record", () => {
    const csv = toCsv([card as Record<string, unknown>], CARD_CSV_COLUMNS);
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe(CARD_CSV_COLUMNS.join(","));
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("fa; en");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    const csv = toCsv([{ title: 'a, "b"' }], ["title"]);
    expect(csv).toContain('"a, ""b"""');
  });
});

describe("collectionToMarkdown", () => {
  it("numbers cards in their given order", () => {
    const out = collectionToMarkdown(
      { title: "Naming Problems", description: "Example." },
      [
        { id: "1", title: "First", original_content: "one" },
        { id: "2", title: "Second", original_content: "two" },
      ],
    );
    expect(out).toContain("# Naming Problems");
    expect(out.indexOf("## 1. First")).toBeLessThan(out.indexOf("## 2. Second"));
  });
});
