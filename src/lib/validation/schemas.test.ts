import { describe, it, expect } from "vitest";
import {
  quickCaptureSchema,
  cardSchema,
  sourceSchema,
  facetSchema,
  collisionReportSchema,
  constitutionSchema,
  colorSwatchSchema,
} from "./schemas";

describe("quickCaptureSchema", () => {
  it("accepts content only and defaults the rest", () => {
    const parsed = quickCaptureSchema.parse({ original_content: "سبز" });
    expect(parsed.original_content).toBe("سبز");
    expect(parsed.title).toBeUndefined();
  });

  it("rejects an invalid source url", () => {
    const result = quickCaptureSchema.safeParse({
      original_content: "x",
      source_url: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("treats an empty source url as undefined", () => {
    const parsed = quickCaptureSchema.parse({
      original_content: "x",
      source_url: "",
    });
    expect(parsed.source_url).toBeUndefined();
  });
});

describe("cardSchema", () => {
  it("applies sensible defaults", () => {
    const parsed = cardSchema.parse({});
    expect(parsed.domain).toBe("research");
    expect(parsed.workflow_status).toBe("inbox");
    expect(parsed.epistemic_status).toBe("unreviewed");
    expect(parsed.book_relation).toBe("untested");
    expect(parsed.language_codes).toEqual([]);
  });

  it("rejects an invalid domain", () => {
    const result = cardSchema.safeParse({ domain: "nonsense" });
    expect(result.success).toBe(false);
  });

  it("coerces year strings and drops empties", () => {
    const parsed = cardSchema.parse({
      historical_start_year: "1590",
      historical_end_year: "",
    });
    expect(parsed.historical_start_year).toBe(1590);
    expect(parsed.historical_end_year).toBeUndefined();
  });
});

describe("colorSwatchSchema", () => {
  it("accepts valid hex", () => {
    expect(colorSwatchSchema.parse({ hex: "#1f4e8c" }).hex).toBe("#1f4e8c");
  });
  it("rejects invalid hex", () => {
    expect(colorSwatchSchema.safeParse({ hex: "blue" }).success).toBe(false);
  });
});

describe("sourceSchema", () => {
  it("requires a title", () => {
    expect(sourceSchema.safeParse({}).success).toBe(false);
    expect(sourceSchema.safeParse({ title: "A Book" }).success).toBe(true);
  });
});

describe("facetSchema", () => {
  it("requires at least one label", () => {
    expect(facetSchema.safeParse({ facet_type: "color_term" }).success).toBe(false);
    expect(
      facetSchema.safeParse({ facet_type: "color_term", label_fa: "سبز" }).success,
    ).toBe(true);
  });
});

describe("constitutionSchema", () => {
  it("requires a version name", () => {
    expect(constitutionSchema.safeParse({}).success).toBe(false);
    expect(constitutionSchema.safeParse({ version_name: "Working 0.1" }).success).toBe(
      true,
    );
  });
});

describe("collisionReportSchema", () => {
  it("requires a card id and bounds confidence", () => {
    expect(collisionReportSchema.safeParse({}).success).toBe(false);
    const ok = collisionReportSchema.safeParse({
      card_id: "00000000-0000-0000-0000-000000000000",
      confidence: 80,
      verdict: "hold",
    });
    expect(ok.success).toBe(true);
    const bad = collisionReportSchema.safeParse({
      card_id: "00000000-0000-0000-0000-000000000000",
      confidence: 150,
    });
    expect(bad.success).toBe(false);
  });
});
