"use client";

import { useActionState, useState } from "react";
import {
  updateCollectionAction,
  archiveCollectionAction,
  deleteCollectionAction,
} from "@/app/(app)/collections/actions";
import type { ActionResult } from "@/lib/actions/util";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";

export function CollectionSettings({
  id,
  title,
  description,
  isArchived,
}: {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateCollectionAction,
    null,
  );

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-ink-muted hover:text-ink text-sm font-medium"
        >
          {open ? "Hide settings" : "Settings"}
        </button>
        <div className="flex items-center gap-2">
          <form action={archiveCollectionAction}>
            <input type="hidden" name="collection_id" value={id} />
            <input type="hidden" name="value" value={(!isArchived).toString()} />
            <Button type="submit" size="sm" variant="ghost">
              {isArchived ? "Unarchive" : "Archive"}
            </Button>
          </form>
          <form action={deleteCollectionAction}>
            <input type="hidden" name="collection_id" value={id} />
            <ConfirmSubmit
              size="sm"
              variant="ghost"
              message="Delete this collection? Cards are not affected."
            >
              Delete
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      {open ? (
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="collection_id" value={id} />
          <Field label="Title" htmlFor="title">
            <Input id="title" name="title" dir="auto" defaultValue={title} />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              defaultValue={description ?? ""}
              className="min-h-20"
            />
          </Field>
          {state?.ok ? (
            <p className="text-success text-sm">Saved.</p>
          ) : state && !state.ok ? (
            <p className="text-danger text-sm">{state.error}</p>
          ) : null}
          <div className="flex justify-end">
            <SubmitButton size="sm" pendingText="Saving…">
              Save
            </SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
