"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCardAction, updateCardAction } from "@/app/(app)/cards/actions";
import type { ActionResult } from "@/lib/actions/util";
import type { CardRow, SourceRow } from "@/lib/supabase/database.types";
import { Field } from "@/components/ui/field";
import { Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  CARD_DOMAINS,
  CARD_TYPES,
  WORKFLOW_STATUSES,
  EPISTEMIC_STATUSES,
  BOOK_RELATIONS,
  DATE_PRECISIONS,
  CALENDAR_SYSTEMS,
  RIGHTS_STATUSES,
} from "@/lib/constants/vocab";

type Props = {
  card?: CardRow;
  sources: Pick<SourceRow, "id" | "title">[];
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-lg border p-5">
      <h2 className="text-ink font-serif text-lg font-medium">{title}</h2>
      {description ? (
        <p className="text-ink-muted mt-0.5 mb-4 text-sm">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

export function CardForm({ card, sources }: Props) {
  const action = card ? updateCardAction : createCardAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const v = card;

  return (
    <form action={formAction} className="space-y-6">
      {card ? <input type="hidden" name="card_id" value={card.id} /> : null}

      <Section title="Identity">
        <Field label="Title" htmlFor="title" error={fe?.title?.[0]}>
          <Input id="title" name="title" dir="auto" defaultValue={v?.title ?? ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Domain" htmlFor="domain">
            <Select id="domain" name="domain" defaultValue={v?.domain ?? "research"}>
              {CARD_DOMAINS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type" htmlFor="card_type">
            <Select
              id="card_type"
              name="card_type"
              defaultValue={v?.card_type ?? "research_note"}
            >
              {CARD_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Workflow status" htmlFor="workflow_status">
            <Select
              id="workflow_status"
              name="workflow_status"
              defaultValue={v?.workflow_status ?? "inbox"}
            >
              {WORKFLOW_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Epistemic status" htmlFor="epistemic_status">
            <Select
              id="epistemic_status"
              name="epistemic_status"
              defaultValue={v?.epistemic_status ?? "unreviewed"}
            >
              {EPISTEMIC_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Relation to the book" htmlFor="book_relation">
            <Select
              id="book_relation"
              name="book_relation"
              defaultValue={v?.book_relation ?? "untested"}
            >
              {BOOK_RELATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pinned" htmlFor="is_favorite">
            <label className="text-ink-muted flex h-10 items-center gap-2 text-sm">
              <input
                id="is_favorite"
                type="checkbox"
                name="is_favorite"
                defaultChecked={v?.is_favorite ?? false}
              />
              Mark as favorite
            </label>
          </Field>
        </div>
      </Section>

      <Section
        title="Archive — original material"
        description="The original is preserved separately and is never overwritten by a translation, summary, or interpretation."
      >
        <Field label="Original content" htmlFor="original_content">
          <Textarea
            id="original_content"
            name="original_content"
            defaultValue={v?.original_content ?? ""}
            className="min-h-40"
          />
        </Field>
        <Field label="Exact quotation" htmlFor="exact_quote">
          <Textarea
            id="exact_quote"
            name="exact_quote"
            defaultValue={v?.exact_quote ?? ""}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Translation" htmlFor="translation">
            <Textarea
              id="translation"
              name="translation"
              defaultValue={v?.translation ?? ""}
            />
          </Field>
          <Field label="Transliteration" htmlFor="transliteration">
            <Textarea
              id="transliteration"
              name="transliteration"
              defaultValue={v?.transliteration ?? ""}
            />
          </Field>
        </div>
      </Section>

      <Section title="Workshop — interpretation">
        <Field label="Working content / edited transcription" htmlFor="working_content">
          <Textarea
            id="working_content"
            name="working_content"
            defaultValue={v?.working_content ?? ""}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Paraphrase" htmlFor="paraphrase">
            <Textarea
              id="paraphrase"
              name="paraphrase"
              defaultValue={v?.paraphrase ?? ""}
            />
          </Field>
          <Field label="Summary" htmlFor="summary">
            <Textarea id="summary" name="summary" defaultValue={v?.summary ?? ""} />
          </Field>
        </div>
        <Field label="Personal annotation" htmlFor="annotation">
          <Textarea
            id="annotation"
            name="annotation"
            defaultValue={v?.annotation ?? ""}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Questions raised" htmlFor="questions">
            <Textarea
              id="questions"
              name="questions"
              defaultValue={v?.questions ?? ""}
            />
          </Field>
          <Field label="Why this card matters" htmlFor="why_it_matters">
            <Textarea
              id="why_it_matters"
              name="why_it_matters"
              defaultValue={v?.why_it_matters ?? ""}
            />
          </Field>
        </div>
      </Section>

      <Section title="Language">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Language codes"
            htmlFor="language_codes"
            hint="Comma-separated, e.g. fa, en"
          >
            <Input
              id="language_codes"
              name="language_codes"
              dir="ltr"
              defaultValue={(v?.language_codes ?? []).join(", ")}
            />
          </Field>
          <Field label="Original language" htmlFor="original_language">
            <Input
              id="original_language"
              name="original_language"
              defaultValue={v?.original_language ?? ""}
            />
          </Field>
          <Field label="Translation language" htmlFor="translation_language">
            <Input
              id="translation_language"
              name="translation_language"
              defaultValue={v?.translation_language ?? ""}
            />
          </Field>
        </div>
      </Section>

      <Section title="Source & provenance">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Source" htmlFor="source_id">
            <Select id="source_id" name="source_id" defaultValue={v?.source_id ?? ""}>
              <option value="">— none —</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Locator (page, folio, timestamp)" htmlFor="source_locator">
            <Input
              id="source_locator"
              name="source_locator"
              defaultValue={v?.source_locator ?? ""}
            />
          </Field>
        </div>
        <Field label="Provenance note" htmlFor="provenance_note">
          <Textarea
            id="provenance_note"
            name="provenance_note"
            defaultValue={v?.provenance_note ?? ""}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rights status" htmlFor="rights_status">
            <Select
              id="rights_status"
              name="rights_status"
              defaultValue={v?.rights_status ?? ""}
            >
              <option value="">— unspecified —</option>
              {RIGHTS_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reliability note" htmlFor="reliability_note">
            <Input
              id="reliability_note"
              name="reliability_note"
              defaultValue={v?.reliability_note ?? ""}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Historical dating"
        description="Kept separate from capture timestamps. Not every date needs a machine date."
      >
        <Field
          label="Human-readable label"
          htmlFor="historical_date_label"
          hint="e.g. c. 1590, Safavid period, 14th century AH"
        >
          <Input
            id="historical_date_label"
            name="historical_date_label"
            dir="auto"
            defaultValue={v?.historical_date_label ?? ""}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field
            label="Start year"
            htmlFor="historical_start_year"
            error={fe?.historical_start_year?.[0]}
          >
            <Input
              id="historical_start_year"
              name="historical_start_year"
              type="number"
              defaultValue={v?.historical_start_year ?? ""}
            />
          </Field>
          <Field
            label="End year"
            htmlFor="historical_end_year"
            error={fe?.historical_end_year?.[0]}
          >
            <Input
              id="historical_end_year"
              name="historical_end_year"
              type="number"
              defaultValue={v?.historical_end_year ?? ""}
            />
          </Field>
          <Field label="Precision" htmlFor="date_precision">
            <Select
              id="date_precision"
              name="date_precision"
              defaultValue={v?.date_precision ?? "unknown"}
            >
              {DATE_PRECISIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Calendar" htmlFor="calendar_system">
            <Select
              id="calendar_system"
              name="calendar_system"
              defaultValue={v?.calendar_system ?? "gregorian"}
            >
              {CALENDAR_SYSTEMS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      {state && !state.ok ? (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Link
          href={card ? `/cards/${card.id}` : "/archive"}
          className="text-ink-muted hover:bg-surface-2 rounded-md px-4 py-2 text-sm"
        >
          Cancel
        </Link>
        <SubmitButton pendingText="Saving…">
          {card ? "Save changes" : "Create card"}
        </SubmitButton>
      </div>
    </form>
  );
}
