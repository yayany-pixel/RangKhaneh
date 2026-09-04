"use client";

import { useActionState } from "react";
import { createFacetAction, updateFacetAction } from "@/app/(app)/settings/actions";
import type { ActionResult } from "@/lib/actions/util";
import { Field } from "@/components/ui/field";
import { Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FACET_TYPES } from "@/lib/constants/vocab";

export type FacetFormValue = {
  id: string;
  facet_type: string;
  label_en: string | null;
  label_fa: string | null;
  description: string | null;
  aliases: string[];
};

export function FacetForm({ facet }: { facet?: FacetFormValue }) {
  const action = facet ? updateFacetAction : createFacetAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      className="border-border bg-surface space-y-3 rounded-lg border p-4"
    >
      {facet ? <input type="hidden" name="facet_id" value={facet.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Facet type" htmlFor="facet_type">
          <Select
            id="facet_type"
            name="facet_type"
            defaultValue={facet?.facet_type ?? "color"}
          >
            {FACET_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="English label" htmlFor="label_en" error={fe?.label_en?.[0]}>
          <Input
            id="label_en"
            name="label_en"
            dir="auto"
            defaultValue={facet?.label_en ?? ""}
          />
        </Field>
        <Field label="Persian label" htmlFor="label_fa">
          <Input
            id="label_fa"
            name="label_fa"
            dir="auto"
            defaultValue={facet?.label_fa ?? ""}
          />
        </Field>
      </div>
      <Field
        label="Aliases & transliterations"
        htmlFor="aliases"
        hint="Comma or newline separated, e.g. qermez, ghermez, قرمز"
      >
        <Input
          id="aliases"
          name="aliases"
          dir="auto"
          defaultValue={facet?.aliases.join(", ") ?? ""}
        />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          dir="auto"
          rows={2}
          defaultValue={facet?.description ?? ""}
        />
      </Field>
      {state && !state.ok ? (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      ) : null}
      {state && state.ok ? (
        <p role="status" className="text-success text-sm">
          Saved.
        </p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">
          {facet ? "Save facet" : "Add facet"}
        </SubmitButton>
      </div>
    </form>
  );
}
