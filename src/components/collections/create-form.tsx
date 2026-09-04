"use client";

import { useActionState } from "react";
import { createCollectionAction } from "@/app/(app)/collections/actions";
import type { ActionResult } from "@/lib/actions/util";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateCollectionForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createCollectionAction,
    null,
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      className="border-border bg-surface space-y-3 rounded-lg border p-5"
    >
      <Field label="Title" htmlFor="title" error={fe?.title?.[0]}>
        <Input id="title" name="title" dir="auto" placeholder="e.g. Blue in mourning" />
      </Field>
      <Field label="Description (optional)" htmlFor="description">
        <Textarea id="description" name="description" className="min-h-20" />
      </Field>
      {state && !state.ok ? (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton pendingText="Creating…">Create collection</SubmitButton>
      </div>
    </form>
  );
}
