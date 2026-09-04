// ---------------------------------------------------------------------------
// Supabase database types.
//
// Hand-authored to mirror supabase/migrations. In a live environment you can
// regenerate this file with `npm run db:types` (requires the Supabase CLI and a
// running local stack). Keep this in sync with the SQL migrations.
// ---------------------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CardDomain = "research" | "creative" | "personal" | "manuscript";

export type WorkflowStatus =
  | "inbox"
  | "processing"
  | "processed"
  | "collision_tested"
  | "connected"
  | "book_candidate"
  | "used_in_book"
  | "independent_value"
  | "dormant"
  | "archived";

export type EpistemicStatus =
  | "not_applicable"
  | "unreviewed"
  | "sourced"
  | "verified"
  | "plausible"
  | "uncertain"
  | "disputed"
  | "speculative";

export type BookRelation =
  | "untested"
  | "central"
  | "supports"
  | "complicates"
  | "contradicts"
  | "extends"
  | "reframes"
  | "illustrates"
  | "inspires"
  | "context_only"
  | "independent_value"
  | "no_current_fit";

export type DatePrecision =
  | "unknown"
  | "exact"
  | "year"
  | "decade"
  | "century"
  | "period"
  | "range";

export type CalendarSystem =
  | "gregorian"
  | "hijri_solar"
  | "hijri_lunar"
  | "other";

export type CardRelationType =
  | "supports"
  | "contradicts"
  | "complicates"
  | "extends"
  | "reframes"
  | "quotes"
  | "responds_to"
  | "derived_from"
  | "same_source"
  | "same_object"
  | "same_term"
  | "same_period"
  | "same_place"
  | "same_motif"
  | "possible_sequence"
  | "related";

export type BookNodeType = "project" | "part" | "chapter" | "section";

export type CardBookUseStatus = "proposed" | "drafted" | "used" | "rejected";

export type CollisionAuthorship = "manual" | "ai_assisted" | "ai_generated";

export type CollisionStatus = "draft" | "complete";

export type CollisionVerdict =
  | "use"
  | "hold"
  | "reject"
  | "independent"
  | "needs_more";

export type ExtractionStatus = "none" | "pending" | "done" | "failed";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

// Convenience helper to build Insert/Update variants.
type WithDefaults<Row, OptionalKeys extends keyof Row> = Omit<
  Row,
  OptionalKeys
> &
  Partial<Pick<Row, OptionalKeys>>;

export interface SourceRow extends Timestamps {
  id: string;
  owner_id: string;
  title: string;
  source_type: string;
  author: string | null;
  publication: string | null;
  publisher: string | null;
  url: string | null;
  archive: string | null;
  identifier: string | null;
  identifier_type: string | null;
  publication_date_label: string | null;
  access_date: string | null;
  rights_status: string | null;
  reliability_note: string | null;
  notes: string | null;
}

export interface CardRow extends Timestamps {
  id: string;
  owner_id: string;
  title: string;
  domain: CardDomain;
  card_type: string;
  workflow_status: WorkflowStatus;
  epistemic_status: EpistemicStatus;
  book_relation: BookRelation;
  original_content: string;
  working_content: string | null;
  exact_quote: string | null;
  paraphrase: string | null;
  translation: string | null;
  transliteration: string | null;
  summary: string | null;
  annotation: string | null;
  questions: string | null;
  why_it_matters: string | null;
  language_codes: string[];
  original_language: string | null;
  translation_language: string | null;
  source_id: string | null;
  source_locator: string | null;
  provenance_note: string | null;
  rights_status: string | null;
  reliability_note: string | null;
  historical_date_label: string | null;
  historical_start_year: number | null;
  historical_end_year: number | null;
  date_precision: DatePrecision;
  calendar_system: CalendarSystem;
  color_swatches: Json;
  is_favorite: boolean;
  captured_at: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  deleted_at: string | null;
  search_related: string;
  search_all: string;
  search_tsv: string | null;
}

export interface FacetRow extends Timestamps {
  id: string;
  owner_id: string;
  facet_type: string;
  label_en: string | null;
  label_fa: string | null;
  description: string | null;
}

export interface FacetAliasRow {
  id: string;
  owner_id: string;
  facet_id: string;
  alias: string;
  created_at: string;
}

export interface CardFacetRow {
  card_id: string;
  facet_id: string;
  owner_id: string;
  note: string | null;
  created_at: string;
}

export interface TagRow {
  id: string;
  owner_id: string;
  label: string;
  normalized: string;
  created_at: string;
}

export interface CardTagRow {
  card_id: string;
  tag_id: string;
  owner_id: string;
  created_at: string;
}

export interface AttachmentRow extends Timestamps {
  id: string;
  owner_id: string;
  card_id: string;
  kind: string;
  storage_path: string;
  original_filename: string;
  mime_type: string | null;
  byte_size: number | null;
  checksum: string | null;
  caption: string | null;
  extracted_text: string | null;
  extraction_status: ExtractionStatus;
  metadata: Json;
}

export interface CollectionRow extends Timestamps {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_archived: boolean;
}

export interface CollectionCardRow {
  collection_id: string;
  card_id: string;
  owner_id: string;
  position: number;
  note: string | null;
  created_at: string;
}

export interface BookConstitutionRow extends Timestamps {
  id: string;
  owner_id: string;
  version_name: string;
  is_current: boolean;
  project_description: string | null;
  central_questions: string | null;
  provisional_thesis: string | null;
  counter_theses: string | null;
  accepted_claims: string | null;
  rejected_claims: string | null;
  methodology: string | null;
  ethics: string | null;
  tone: string | null;
  chapter_outline: string | null;
  glossary: string | null;
  known_problems: string | null;
  body_markdown: string | null;
  revision_note: string | null;
}

export interface BookSectionRow extends Timestamps {
  id: string;
  owner_id: string;
  parent_id: string | null;
  node_type: BookNodeType;
  title: string;
  summary: string | null;
  position: number;
  constitution_id: string | null;
}

export interface CardBookLinkRow extends Timestamps {
  id: string;
  owner_id: string;
  card_id: string;
  section_id: string;
  book_relation: BookRelation;
  intended_use: string | null;
  priority: number;
  rationale: string | null;
  citation_note: string | null;
  excerpt_used: string | null;
  use_status: CardBookUseStatus;
}

export interface CollisionReportRow extends Timestamps {
  id: string;
  owner_id: string;
  card_id: string;
  constitution_id: string | null;
  authorship: CollisionAuthorship;
  status: CollisionStatus;
  what_it_says: string | null;
  extracted_units: string | null;
  evidence_vs_interpretation: string | null;
  missing_verification: string | null;
  agreements: string | null;
  contradictions: string | null;
  complications: string | null;
  forcing_risk: string | null;
  possible_uses: string | null;
  placement_suggestions: string | null;
  independent_uses: string | null;
  verification_tasks: string | null;
  related_card_queries: string | null;
  warnings: string | null;
  confidence: number | null;
  verdict: CollisionVerdict | null;
  human_rationale: string | null;
  ai_suggestion: Json | null;
  ai_status: string | null;
}

export interface CardRelationRow {
  id: string;
  owner_id: string;
  from_card_id: string;
  to_card_id: string;
  relation_type: CardRelationType;
  note: string | null;
  created_at: string;
}

export interface CardRevisionRow {
  id: string;
  owner_id: string;
  card_id: string;
  snapshot: Json;
  reason: string | null;
  created_at: string;
}

export interface UserSettingsRow extends Timestamps {
  owner_id: string;
  ai_enabled: boolean;
  preferences: Json;
  last_export_at: string | null;
  last_export_summary: Json | null;
}

type Table<Row, InsertOptional extends keyof Row, UpdatableRow = Row> = {
  Row: Row;
  Insert: WithDefaults<Row, InsertOptional>;
  Update: Partial<UpdatableRow>;
  Relationships: [];
};

// Columns that always have DB defaults and may be omitted on insert.
type CommonAuto = "id" | "owner_id" | "created_at" | "updated_at";

export interface Database {
  public: {
    Tables: {
      sources: Table<SourceRow, CommonAuto | "source_type">;
      cards: Table<
        CardRow,
        | CommonAuto
        | "title"
        | "domain"
        | "card_type"
        | "workflow_status"
        | "epistemic_status"
        | "book_relation"
        | "original_content"
        | "working_content"
        | "exact_quote"
        | "paraphrase"
        | "translation"
        | "transliteration"
        | "summary"
        | "annotation"
        | "questions"
        | "why_it_matters"
        | "language_codes"
        | "original_language"
        | "translation_language"
        | "source_id"
        | "source_locator"
        | "provenance_note"
        | "rights_status"
        | "reliability_note"
        | "historical_date_label"
        | "historical_start_year"
        | "historical_end_year"
        | "date_precision"
        | "calendar_system"
        | "color_swatches"
        | "is_favorite"
        | "captured_at"
        | "last_reviewed_at"
        | "next_review_at"
        | "deleted_at"
        | "search_related"
        | "search_all"
        | "search_tsv"
      >;
      facets: Table<FacetRow, CommonAuto | "facet_type" | "description">;
      facet_aliases: Table<FacetAliasRow, "id" | "owner_id" | "created_at">;
      card_facets: Table<CardFacetRow, "owner_id" | "created_at" | "note">;
      tags: Table<TagRow, "id" | "owner_id" | "created_at" | "normalized">;
      card_tags: Table<CardTagRow, "owner_id" | "created_at">;
      attachments: Table<
        AttachmentRow,
        | CommonAuto
        | "kind"
        | "mime_type"
        | "byte_size"
        | "checksum"
        | "caption"
        | "extracted_text"
        | "extraction_status"
        | "metadata"
      >;
      collections: Table<
        CollectionRow,
        CommonAuto | "description" | "is_archived"
      >;
      collection_cards: Table<
        CollectionCardRow,
        "owner_id" | "created_at" | "position" | "note"
      >;
      book_constitutions: Table<
        BookConstitutionRow,
        | CommonAuto
        | "is_current"
        | "project_description"
        | "central_questions"
        | "provisional_thesis"
        | "counter_theses"
        | "accepted_claims"
        | "rejected_claims"
        | "methodology"
        | "ethics"
        | "tone"
        | "chapter_outline"
        | "glossary"
        | "known_problems"
        | "body_markdown"
        | "revision_note"
      >;
      book_sections: Table<
        BookSectionRow,
        | CommonAuto
        | "parent_id"
        | "node_type"
        | "summary"
        | "position"
        | "constitution_id"
      >;
      card_book_links: Table<
        CardBookLinkRow,
        | CommonAuto
        | "book_relation"
        | "intended_use"
        | "priority"
        | "rationale"
        | "citation_note"
        | "excerpt_used"
        | "use_status"
      >;
      collision_reports: Table<
        CollisionReportRow,
        | CommonAuto
        | "constitution_id"
        | "authorship"
        | "status"
        | "what_it_says"
        | "extracted_units"
        | "evidence_vs_interpretation"
        | "missing_verification"
        | "agreements"
        | "contradictions"
        | "complications"
        | "forcing_risk"
        | "possible_uses"
        | "placement_suggestions"
        | "independent_uses"
        | "verification_tasks"
        | "related_card_queries"
        | "warnings"
        | "confidence"
        | "verdict"
        | "human_rationale"
        | "ai_suggestion"
        | "ai_status"
      >;
      card_relations: Table<
        CardRelationRow,
        "id" | "owner_id" | "created_at" | "relation_type" | "note"
      >;
      card_revisions: Table<
        CardRevisionRow,
        "id" | "owner_id" | "created_at" | "reason"
      >;
      user_settings: Table<
        UserSettingsRow,
        | "owner_id"
        | "created_at"
        | "updated_at"
        | "ai_enabled"
        | "preferences"
        | "last_export_at"
        | "last_export_summary"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      card_domain: CardDomain;
      workflow_status: WorkflowStatus;
      epistemic_status: EpistemicStatus;
      book_relation: BookRelation;
      date_precision: DatePrecision;
      calendar_system: CalendarSystem;
      card_relation_type: CardRelationType;
      book_node_type: BookNodeType;
      card_book_use_status: CardBookUseStatus;
      collision_authorship: CollisionAuthorship;
      collision_status: CollisionStatus;
      collision_verdict: CollisionVerdict;
      extraction_status: ExtractionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
