# Rangkhaneh / رنگ‌خانه — Product Brief

A private, single-user research archive and writing laboratory for the evolving
book project **Colors of Iran**.

This is not a notes app. It is a place where raw evidence, provisional ideas,
creative fragments, images, handwritten pages, poems, quotations, historical
materials, linguistic observations, and book passages can coexist without being
forced into one argument. The fundamental object is a **Card**. A card can remain
independently valuable even if it is never used in the book.

- **Working name:** Rangkhaneh / رنگ‌خانه
- **Descriptor:** A private archive and argument workshop for _Colors of Iran_

## The three-layer model

The app keeps three layers visibly separate:

1. **Archive** — the original material and its provenance.
2. **Workshop** — interpretation, annotation, relationships, questions, the Collision Test.
3. **Book** — possible chapter placement, manuscript use, quotations, final decisions.

Never overwrite the original material with a summary, translation, OCR result, or
AI interpretation.

## Core principles

- Capture first; organize later.
- Preserve rejected ideas rather than deleting them.
- Separate quotation, paraphrase, interpretation, and invention.
- Let the book evolve without corrupting earlier analysis.
- Treat uncertainty as information.
- Treat "does not fit the current book" as a valid, useful conclusion.
- Creative cards must not be judged by the same truth criteria as research cards.
- Persian and English must work equally well, including mixed RTL/LTR content.
- Every important action must be reversible or versioned.
- The user must be able to export the archive and leave the software.

## Card domains

`research` · `creative` · `personal` (personal or field note) · `manuscript`

## Card types (editable controlled list)

source_excerpt, quotation, research_note, claim_hypothesis, counterargument,
linguistic_note, color_term, material_process, artwork_object, image_observation,
historical_practice, interview_oral_history, field_note, memory_dream,
question_gap, poem, fiction_fragment, handwritten_page, book_passage,
bibliographic_source, other.

## Workflow statuses

inbox, processing, processed, collision_tested, connected, book_candidate,
used_in_book, independent_value, dormant, archived.

## Epistemic statuses

not_applicable, unreviewed, sourced, verified, plausible, uncertain, disputed,
speculative. A creative card should usually use `not_applicable`.

## Relation to the book

untested, central, supports, complicates, contradicts, extends, reframes,
illustrates, inspires, context_only, independent_value, no_current_fit.
One card may link to several chapters with different relationships.

## The Book Constitution

A versioned document representing the current state of the project: project
description, central questions, provisional thesis, counter-theses, accepted
claims, rejected claims, methodology, ethics, tone, chapter outline, glossary,
known problems, version note. Old versions are preserved. Every Collision Report
points at the exact Book Constitution version used.

## The Collision Test ("Test Against the Book")

A structured comparison between one card and one version of the Book Constitution.
It records extracted claims/creative units, agreements, contradictions,
complications, possible uses, placement suggestions, independent uses,
verification tasks, related-card queries, confidence, warnings, and a human
verdict + rationale. Reports may be fully manual; AI assistance is optional and
never silently replaces human judgment.

## Phased delivery

- **Phase 1 — The Cabinet (this build):** auth, cards CRUD, sources, facets/tags,
  attachments, collections, quick capture, inbox, Persian+English, keyword/fuzzy
  search, filters, manual Collision Reports, Book Constitution versions, Book Map,
  version history, JSON/CSV/Markdown/ZIP export.
- **Phase 2 — The Workshop:** AI-assisted collision reports, related-card and
  duplicate detection, saved searches, review reminders, OCR/transcription.
- **Phase 3 — The Atlas:** hybrid/semantic search, color wall, timeline, map,
  relationship graph, integrations, multi-project.

See `implementation-plan.md` for the delivered slices and `decisions.md` for
assumptions made during this build.
