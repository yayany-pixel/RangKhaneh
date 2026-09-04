/**
 * Analysis provider interface.
 *
 * Phase 1 ships a single {@link ManualProvider} that performs NO network calls
 * and returns NO machine-generated content. It only builds a provider-neutral
 * prompt the human can copy into any external tool, and validates a suggestion
 * the human chooses to paste back for review.
 *
 * Phases 2/3 may add real providers implementing this same interface. AI output
 * must always be labeled and must never overwrite human-authored fields.
 */
import { z } from "zod";

export interface CollisionPromptInput {
  card: {
    title: string | null;
    domain: string;
    card_type: string;
    original_content: string | null;
    working_content: string | null;
    exact_quote: string | null;
    paraphrase: string | null;
    translation: string | null;
    summary: string | null;
  };
  constitution: {
    version_name: string;
    project_description: string | null;
    central_questions: string | null;
    provisional_thesis: string | null;
    counter_theses: string | null;
    accepted_claims: string | null;
    rejected_claims: string | null;
    body_markdown: string | null;
  } | null;
}

/** Structured suggestion shape a human may paste back for review. */
export const analysisSuggestionSchema = z.object({
  what_it_says: z.string().optional(),
  extracted_units: z.string().optional(),
  evidence_vs_interpretation: z.string().optional(),
  missing_verification: z.string().optional(),
  agreements: z.string().optional(),
  contradictions: z.string().optional(),
  complications: z.string().optional(),
  forcing_risk: z.string().optional(),
  possible_uses: z.string().optional(),
  placement_suggestions: z.string().optional(),
  independent_uses: z.string().optional(),
  verification_tasks: z.string().optional(),
  related_card_queries: z.string().optional(),
  warnings: z.string().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
});
export type AnalysisSuggestion = z.infer<typeof analysisSuggestionSchema>;

export interface AnalysisProvider {
  readonly id: string;
  readonly label: string;
  /** Whether this provider performs external calls. Manual = false. */
  readonly isAutomated: boolean;
  /** Build a provider-neutral prompt the user can copy elsewhere. */
  buildCollisionPrompt(input: CollisionPromptInput): string;
  /** Parse a pasted suggestion, returning typed data or a list of errors. */
  parseSuggestion(
    raw: string,
  ): { ok: true; value: AnalysisSuggestion } | { ok: false; error: string };
}

function section(label: string, value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text ? `## ${label}\n${text}\n` : "";
}

export const ManualProvider: AnalysisProvider = {
  id: "manual",
  label: "Manual (no AI)",
  isAutomated: false,

  buildCollisionPrompt({ card, constitution }) {
    const parts: string[] = [];
    parts.push(
      "You are helping test one research/creative card against the current",
      "constitution of a book project. Separate quotation, paraphrase,",
      "interpretation, and invention. Do not force a fit. Return JSON with keys:",
      "what_it_says, extracted_units, evidence_vs_interpretation,",
      "missing_verification, agreements, contradictions, complications,",
      "forcing_risk, possible_uses, placement_suggestions, independent_uses,",
      "verification_tasks, related_card_queries, warnings, confidence (0-100).",
      "",
      "# CARD",
      `Title: ${card.title ?? "(untitled)"}`,
      `Domain: ${card.domain} / Type: ${card.card_type}`,
      "",
      section("Original content", card.original_content),
      section("Working content", card.working_content),
      section("Exact quote", card.exact_quote),
      section("Paraphrase", card.paraphrase),
      section("Translation", card.translation),
      section("Summary", card.summary),
    );
    if (constitution) {
      parts.push(
        "",
        `# BOOK CONSTITUTION — ${constitution.version_name}`,
        section("Project description", constitution.project_description),
        section("Central questions", constitution.central_questions),
        section("Provisional thesis", constitution.provisional_thesis),
        section("Counter-theses", constitution.counter_theses),
        section("Accepted claims", constitution.accepted_claims),
        section("Rejected claims", constitution.rejected_claims),
        section("Body", constitution.body_markdown),
      );
    } else {
      parts.push("", "# BOOK CONSTITUTION\n(No current constitution selected.)");
    }
    return parts.filter(Boolean).join("\n").trim() + "\n";
  },

  parseSuggestion(raw) {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Not valid JSON." };
    }
    const result = analysisSuggestionSchema.safeParse(json);
    if (!result.success) {
      return { ok: false, error: result.error.issues[0]?.message ?? "Invalid shape." };
    }
    return { ok: true, value: result.data };
  },
};

export const analysisProvider: AnalysisProvider = ManualProvider;
