import { z } from "zod";
import {
  BOOK_NODE_TYPES,
  BOOK_RELATIONS,
  CALENDAR_SYSTEMS,
  CARD_BOOK_USE_STATUSES,
  CARD_DOMAINS,
  CARD_RELATION_TYPES,
  COLLISION_VERDICTS,
  DATE_PRECISIONS,
  EPISTEMIC_STATUSES,
  WORKFLOW_STATUSES,
  type Option,
} from "@/lib/constants/vocab";

const enumValues = <T extends readonly Option[]>(opts: T) =>
  opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

export const domainEnum = z.enum(enumValues(CARD_DOMAINS));
export const workflowEnum = z.enum(enumValues(WORKFLOW_STATUSES));
export const epistemicEnum = z.enum(enumValues(EPISTEMIC_STATUSES));
export const bookRelationEnum = z.enum(enumValues(BOOK_RELATIONS));
export const datePrecisionEnum = z.enum(enumValues(DATE_PRECISIONS));
export const calendarEnum = z.enum(enumValues(CALENDAR_SYSTEMS));
export const relationTypeEnum = z.enum(enumValues(CARD_RELATION_TYPES));
export const bookNodeEnum = z.enum(enumValues(BOOK_NODE_TYPES));
export const useStatusEnum = z.enum(enumValues(CARD_BOOK_USE_STATUSES));
export const verdictEnum = z.enum(enumValues(COLLISION_VERDICTS));

// Empty strings from form fields become undefined/null.
const optionalText = z
  .string()
  .trim()
  .max(20000)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalShort = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalYear = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(-4000).max(4000).optional(),
);

export const colorSwatchSchema = z.object({
  hex: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #1f4e8c"),
  label: z.string().trim().max(120).optional(),
});

// ---------------------------------------------------------------------------
// Quick capture — minimal, never blocks saving on incomplete metadata.
// ---------------------------------------------------------------------------
export const quickCaptureSchema = z.object({
  original_content: z.string().trim().max(50000).default(""),
  title: optionalShort,
  card_type: z.string().trim().min(1).max(80).optional(),
  domain: domainEnum.optional(),
  source_url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type QuickCaptureInput = z.infer<typeof quickCaptureSchema>;

// ---------------------------------------------------------------------------
// Full card create / update.
// ---------------------------------------------------------------------------
export const cardSchema = z.object({
  title: z.string().trim().max(500).default(""),
  domain: domainEnum.default("research"),
  card_type: z.string().trim().min(1).max(80).default("research_note"),
  workflow_status: workflowEnum.default("inbox"),
  epistemic_status: epistemicEnum.default("unreviewed"),
  book_relation: bookRelationEnum.default("untested"),

  original_content: z.string().max(50000).default(""),
  working_content: optionalText,
  exact_quote: optionalText,
  paraphrase: optionalText,
  translation: optionalText,
  transliteration: optionalText,
  summary: optionalText,
  annotation: optionalText,
  questions: optionalText,
  why_it_matters: optionalText,

  language_codes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  original_language: optionalShort,
  translation_language: optionalShort,

  source_id: z.string().uuid().optional().nullable(),
  source_locator: optionalShort,
  provenance_note: optionalText,
  rights_status: optionalShort,
  reliability_note: optionalText,

  historical_date_label: optionalShort,
  historical_start_year: optionalYear,
  historical_end_year: optionalYear,
  date_precision: datePrecisionEnum.default("unknown"),
  calendar_system: calendarEnum.default("gregorian"),

  color_swatches: z.array(colorSwatchSchema).max(24).default([]),
  is_favorite: z.boolean().default(false),
  next_review_at: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type CardInput = z.infer<typeof cardSchema>;

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------
export const sourceSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(500),
  source_type: z.string().trim().min(1).max(60).default("other"),
  author: optionalShort,
  publication: optionalShort,
  publisher: optionalShort,
  url: z
    .string()
    .trim()
    .url()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  archive: optionalShort,
  identifier: optionalShort,
  identifier_type: optionalShort,
  publication_date_label: optionalShort,
  access_date: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  rights_status: optionalShort,
  reliability_note: optionalText,
  notes: optionalText,
});
export type SourceInput = z.infer<typeof sourceSchema>;

// ---------------------------------------------------------------------------
// Facet / tag
// ---------------------------------------------------------------------------
export const facetSchema = z
  .object({
    facet_type: z.string().trim().min(1).max(60).default("custom"),
    label_en: optionalShort,
    label_fa: optionalShort,
    description: optionalText,
    aliases: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  })
  .refine((v) => Boolean(v.label_en || v.label_fa), {
    message: "Provide an English or Persian label",
    path: ["label_en"],
  });
export type FacetInput = z.infer<typeof facetSchema>;

export const tagSchema = z.object({
  label: z.string().trim().min(1).max(120),
});
export type TagInput = z.infer<typeof tagSchema>;

// ---------------------------------------------------------------------------
// Attachment metadata (the file itself is uploaded separately to storage)
// ---------------------------------------------------------------------------
export const attachmentMetaSchema = z.object({
  kind: z.string().trim().min(1).max(40).default("other"),
  caption: optionalShort,
  extracted_text: optionalText,
});
export type AttachmentMetaInput = z.infer<typeof attachmentMetaSchema>;

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------
export const collectionSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(200),
  description: optionalText,
});
export type CollectionInput = z.infer<typeof collectionSchema>;

// ---------------------------------------------------------------------------
// Book constitution
// ---------------------------------------------------------------------------
export const constitutionSchema = z.object({
  version_name: z.string().trim().min(1, "Name this version").max(200),
  revision_note: optionalText,
  project_description: optionalText,
  central_questions: optionalText,
  provisional_thesis: optionalText,
  counter_theses: optionalText,
  accepted_claims: optionalText,
  rejected_claims: optionalText,
  methodology: optionalText,
  ethics: optionalText,
  tone: optionalText,
  chapter_outline: optionalText,
  glossary: optionalText,
  known_problems: optionalText,
  body_markdown: optionalText,
});
export type ConstitutionInput = z.infer<typeof constitutionSchema>;

// ---------------------------------------------------------------------------
// Book section
// ---------------------------------------------------------------------------
export const bookSectionSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(300),
  node_type: bookNodeEnum.default("section"),
  summary: optionalText,
  parent_id: z.string().uuid().optional().nullable(),
  constitution_id: z.string().uuid().optional().nullable(),
});
export type BookSectionInput = z.infer<typeof bookSectionSchema>;

// ---------------------------------------------------------------------------
// Card <-> section link
// ---------------------------------------------------------------------------
export const cardBookLinkSchema = z.object({
  card_id: z.string().uuid(),
  section_id: z.string().uuid(),
  book_relation: bookRelationEnum.default("untested"),
  intended_use: optionalText,
  priority: z.coerce.number().int().min(0).max(1000).default(0),
  rationale: optionalText,
  citation_note: optionalText,
  excerpt_used: optionalText,
  use_status: useStatusEnum.default("proposed"),
});
export type CardBookLinkInput = z.infer<typeof cardBookLinkSchema>;

// ---------------------------------------------------------------------------
// Collision report (manual)
// ---------------------------------------------------------------------------
export const collisionReportSchema = z.object({
  card_id: z.string().uuid(),
  constitution_id: z.string().uuid().optional().nullable(),
  what_it_says: optionalText,
  extracted_units: optionalText,
  evidence_vs_interpretation: optionalText,
  missing_verification: optionalText,
  agreements: optionalText,
  contradictions: optionalText,
  complications: optionalText,
  forcing_risk: optionalText,
  possible_uses: optionalText,
  placement_suggestions: optionalText,
  independent_uses: optionalText,
  verification_tasks: optionalText,
  related_card_queries: optionalText,
  warnings: optionalText,
  confidence: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(100).optional(),
  ),
  verdict: verdictEnum.optional().nullable(),
  human_rationale: optionalText,
});
export type CollisionReportInput = z.infer<typeof collisionReportSchema>;

// ---------------------------------------------------------------------------
// Card relation
// ---------------------------------------------------------------------------
export const cardRelationSchema = z.object({
  from_card_id: z.string().uuid(),
  to_card_id: z.string().uuid(),
  relation_type: relationTypeEnum.default("related"),
  note: optionalText,
});
export type CardRelationInput = z.infer<typeof cardRelationSchema>;
