"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSourceAction, updateSourceAction } from "@/app/(app)/sources/actions";
import type { ActionResult } from "@/lib/actions/util";
import type { SourceRow } from "@/lib/supabase/database.types";
import { Field } from "@/components/ui/field";
import { Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { SOURCE_TYPES, RIGHTS_STATUSES } from "@/lib/constants/vocab";

export function SourceForm({ source }: { source?: SourceRow }) {
  const action = source ? updateSourceAction : createSourceAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const v = source;

  return (
    <form
      action={formAction}
      className="border-border bg-surface space-y-4 rounded-lg border p-5"
    >
      {source ? <input type="hidden" name="source_id" value={source.id} /> : null}

      <Field label="Title" htmlFor="title" error={fe?.title?.[0]}>
        <Input id="title" name="title" dir="auto" defaultValue={v?.title ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type" htmlFor="source_type">
          <Select
            id="source_type"
            name="source_type"
            defaultValue={v?.source_type ?? "book"}
          >
            {SOURCE_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Author or creator" htmlFor="author">
          <Input id="author" name="author" dir="auto" defaultValue={v?.author ?? ""} />
        </Field>
        <Field label="Publication or collection" htmlFor="publication">
          <Input
            id="publication"
            name="publication"
            dir="auto"
            defaultValue={v?.publication ?? ""}
          />
        </Field>
        <Field label="Publisher" htmlFor="publisher">
          <Input
            id="publisher"
            name="publisher"
            dir="auto"
            defaultValue={v?.publisher ?? ""}
          />
        </Field>
        <Field label="URL" htmlFor="url" error={fe?.url?.[0]}>
          <Input id="url" name="url" type="url" dir="ltr" defaultValue={v?.url ?? ""} />
        </Field>
        <Field label="Archive or library" htmlFor="archive">
          <Input
            id="archive"
            name="archive"
            dir="auto"
            defaultValue={v?.archive ?? ""}
          />
        </Field>
        <Field label="Identifier (ISBN, DOI, shelf mark)" htmlFor="identifier">
          <Input
            id="identifier"
            name="identifier"
            dir="ltr"
            defaultValue={v?.identifier ?? ""}
          />
        </Field>
        <Field label="Identifier type" htmlFor="identifier_type">
          <Input
            id="identifier_type"
            name="identifier_type"
            defaultValue={v?.identifier_type ?? ""}
            placeholder="ISBN, DOI, accession…"
          />
        </Field>
        <Field label="Publication date label" htmlFor="publication_date_label">
          <Input
            id="publication_date_label"
            name="publication_date_label"
            dir="auto"
            defaultValue={v?.publication_date_label ?? ""}
          />
        </Field>
        <Field label="Access date" htmlFor="access_date">
          <Input
            id="access_date"
            name="access_date"
            type="date"
            defaultValue={v?.access_date ?? ""}
          />
        </Field>
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
      </div>
      <Field label="Reliability note" htmlFor="reliability_note">
        <Input
          id="reliability_note"
          name="reliability_note"
          dir="auto"
          defaultValue={v?.reliability_note ?? ""}
        />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={v?.notes ?? ""} />
      </Field>

      {state && !state.ok ? (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Link
          href="/sources"
          className="text-ink-muted hover:bg-surface-2 rounded-md px-4 py-2 text-sm"
        >
          Cancel
        </Link>
        <SubmitButton pendingText="Saving…">
          {source ? "Save source" : "Create source"}
        </SubmitButton>
      </div>
    </form>
  );
}
