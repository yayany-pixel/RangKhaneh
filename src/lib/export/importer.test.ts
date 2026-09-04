import { describe, it, expect } from "vitest";
import { parseArchive, planImport, buildImportRecords } from "@/lib/export/importer";
import { ARCHIVE_SCHEMA_VERSION, type Archive } from "@/lib/export/schema";

const S1 = "11111111-1111-4111-8111-111111111111";
const C1 = "22222222-2222-4222-8222-222222222222";

function manifest(version = ARCHIVE_SCHEMA_VERSION) {
  return {
    app: "rangkhaneh",
    schema_version: version,
    exported_at: "2024-01-01T00:00:00.000Z",
  };
}

describe("parseArchive", () => {
  it("accepts a well-formed archive at the current version", () => {
    const result = parseArchive({ manifest: manifest() });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.archive.cards).toEqual([]);
  });

  it("rejects a mismatched schema version", () => {
    const result = parseArchive({ manifest: manifest(999) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/Unsupported archive schema version/);
    }
  });

  it("rejects a malformed archive (missing manifest)", () => {
    const result = parseArchive({});
    expect(result.ok).toBe(false);
  });

  it("rejects a keyed row without a valid uuid", () => {
    const result = parseArchive({
      manifest: manifest(),
      cards: [{ id: "not-a-uuid" }],
    });
    expect(result.ok).toBe(false);
  });
});

describe("planImport", () => {
  const archive = {
    manifest: manifest(),
    sources: [{ id: S1 }],
    cards: [{ id: C1 }],
  } as unknown as Archive;

  it("counts new records as creates", () => {
    const plan = planImport(archive, {}, "skip");
    expect(plan.totals.incoming).toBe(2);
    expect(plan.totals.willCreate).toBe(2);
    expect(plan.totals.conflicts).toBe(0);
  });

  it("counts conflicts as skips under the skip strategy", () => {
    const plan = planImport(archive, { sources: new Set([S1]) }, "skip");
    expect(plan.totals.conflicts).toBe(1);
    expect(plan.totals.willSkip).toBe(1);
    expect(plan.tables.sources.willSkip).toBe(1);
  });

  it("counts conflicts as overwrites/copies under the respective strategies", () => {
    const existing = { sources: new Set([S1]) };
    expect(planImport(archive, existing, "overwrite").totals.willOverwrite).toBe(1);
    expect(planImport(archive, existing, "copy").totals.willCopy).toBe(1);
  });
});

describe("buildImportRecords", () => {
  const archive = {
    manifest: manifest(),
    sources: [{ id: S1, title: "A source" }],
    cards: [{ id: C1, title: "A card", source_id: S1 }],
  } as unknown as Archive;

  const genIds = () => {
    let n = 0;
    return () => `00000000-0000-4000-8000-00000000000${(++n).toString(16)}`;
  };

  it("forces owner_id on every written row", () => {
    const ops = buildImportRecords(archive, {}, "skip", "owner-x", genIds());
    for (const op of ops) {
      for (const row of op.rows) expect(row.owner_id).toBe("owner-x");
    }
  });

  it("drops conflicting rows (and their dependents) under skip", () => {
    const ops = buildImportRecords(
      archive,
      { sources: new Set([S1]) },
      "skip",
      "owner-x",
      genIds(),
    );
    const sources = ops.find((o) => o.table === "sources")!;
    const cards = ops.find((o) => o.table === "cards")!;
    expect(sources.rows).toHaveLength(0);
    // The card referenced the skipped source, so it is dropped to avoid an FK error.
    expect(cards.rows).toHaveLength(0);
  });

  it("keeps original ids when overwriting", () => {
    const ops = buildImportRecords(
      archive,
      { sources: new Set([S1]) },
      "overwrite",
      "owner-x",
      genIds(),
    );
    const sources = ops.find((o) => o.table === "sources")!;
    expect(sources.rows[0].id).toBe(S1);
  });

  it("remaps ids and foreign keys when copying conflicts", () => {
    const ops = buildImportRecords(
      archive,
      { sources: new Set([S1]) },
      "copy",
      "owner-x",
      genIds(),
    );
    const newSourceId = ops.find((o) => o.table === "sources")!.rows[0].id;
    const card = ops.find((o) => o.table === "cards")!.rows[0];
    expect(newSourceId).not.toBe(S1);
    // The card's FK must follow the copied source's new id.
    expect(card.source_id).toBe(newSourceId);
  });

  it("remaps join-table foreign keys and drops rows with dropped targets", () => {
    const joinArchive = {
      manifest: manifest(),
      cards: [{ id: C1 }],
      tags: [{ id: S1 }],
      card_tags: [{ card_id: C1, tag_id: S1 }],
    } as unknown as Archive;

    // tag S1 already exists → skipped → the join row must be dropped.
    const ops = buildImportRecords(
      joinArchive,
      { tags: new Set([S1]) },
      "skip",
      "owner-x",
      genIds(),
    );
    const cardTags = ops.find((o) => o.table === "card_tags")!;
    expect(cardTags.rows).toHaveLength(0);
  });
});
