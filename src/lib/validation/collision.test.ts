import { describe, it, expect } from "vitest";
import {
  constitutionSchema,
  collisionReportSchema,
  cardBookLinkSchema,
} from "@/lib/validation/schemas";

const CARD = "22222222-2222-4222-8222-222222222222";
const SECTION = "33333333-3333-4333-8333-333333333333";
const CONSTITUTION = "44444444-4444-4444-8444-444444444444";

describe("constitutionSchema", () => {
  it("requires a version name", () => {
    expect(constitutionSchema.safeParse({ version_name: "" }).success).toBe(false);
  });

  it("accepts a minimal version and normalizes empty prose to undefined", () => {
    const parsed = constitutionSchema.safeParse({
      version_name: "Working Constitution 0.1",
      methodology: "   ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.methodology).toBeUndefined();
  });
});

describe("collisionReportSchema", () => {
  it("requires a valid card id", () => {
    expect(collisionReportSchema.safeParse({ card_id: "nope" }).success).toBe(false);
  });

  it("accepts a manual report tied to a constitution version", () => {
    const parsed = collisionReportSchema.safeParse({
      card_id: CARD,
      constitution_id: CONSTITUTION,
      what_it_says: "It complicates the naming thesis.",
      verdict: "hold",
      confidence: "60",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.confidence).toBe(60);
      expect(parsed.data.verdict).toBe("hold");
    }
  });

  it("rejects an out-of-range confidence", () => {
    const parsed = collisionReportSchema.safeParse({
      card_id: CARD,
      confidence: "150",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown verdict", () => {
    const parsed = collisionReportSchema.safeParse({
      card_id: CARD,
      verdict: "definitely",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("cardBookLinkSchema", () => {
  it("defaults relationship and use status", () => {
    const parsed = cardBookLinkSchema.safeParse({
      card_id: CARD,
      section_id: SECTION,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.book_relation).toBe("untested");
      expect(parsed.data.use_status).toBe("proposed");
      expect(parsed.data.priority).toBe(0);
    }
  });

  it("coerces a numeric priority from a string", () => {
    const parsed = cardBookLinkSchema.safeParse({
      card_id: CARD,
      section_id: SECTION,
      priority: "3",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.priority).toBe(3);
  });
});
