"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTagAction } from "@/app/(app)/cards/actions";
import type { ActionResult } from "@/lib/actions/util";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AddTagForm({ cardId }: { cardId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    addTagAction,
    null,
  );
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok && ref.current) ref.current.value = "";
  }, [state]);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="card_id" value={cardId} />
      <div className="flex-1">
        <Input
          ref={ref}
          name="label"
          dir="auto"
          placeholder="Add a tag…"
          aria-label="New tag"
        />
        {state && !state.ok ? (
          <p className="text-danger mt-1 text-xs">{state.error}</p>
        ) : null}
      </div>
      <SubmitButton size="sm" variant="secondary" pendingText="…">
        Add
      </SubmitButton>
    </form>
  );
}
