"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createConstitutionAction,
  updateConstitutionAction,
} from "@/app/(app)/book/actions";
import type { ActionResult } from "@/lib/actions/util";
import type { BookConstitutionRow } from "@/lib/supabase/database.types";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const SECTIONS: { name: keyof BookConstitutionRow; label: string; hint?: string }[] = [
  { name: "project_description", label: "Project description" },
  { name: "central_questions", label: "Central questions" },
  { name: "provisional_thesis", label: "Provisional thesis" },
  { name: "counter_theses", label: "Important counter-theses" },
  { name: "accepted_claims", label: "Claims currently accepted" },
  {
    name: "rejected_claims",
    label: "Claims currently rejected or under suspicion",
  },
  { name: "methodology", label: "Methodological rules" },
  { name: "ethics", label: "Ethical rules" },
  { name: "tone", label: "Tone and literary ambitions" },
  { name: "chapter_outline", label: "Current chapter outline" },
  { name: "glossary", label: "Key terms and definitions" },
  { name: "known_problems", label: "Known problems and contradictions" },
];

export function ConstitutionForm({
  constitution,
}: {
  constitution?: BookConstitutionRow;
}) {
  const action = constitution ? updateConstitutionAction : createConstitutionAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const v = constitution;

  return (
    <form
      action={formAction}
      className="border-border bg-surface space-y-4 rounded-lg border p-5"
    >
      {constitution ? (
        <input type="hidden" name="constitution_id" value={constitution.id} />
      ) : null}

      <Field label="Version name" htmlFor="version_name" error={fe?.version_name?.[0]}>
        <Input
          id="version_name"
          name="version_name"
          dir="auto"
          defaultValue={v?.version_name ?? ""}
          placeholder="Working Constitution 0.1"
        />
      </Field>

      {SECTIONS.map((s) => (
        <Field key={s.name} label={s.label} htmlFor={s.name} hint={s.hint}>
          <Textarea
            id={s.name}
            name={s.name}
            dir="auto"
            rows={2}
            defaultValue={(v?.[s.name] as string | null) ?? ""}
          />
        </Field>
      ))}

      <Field
        label="Free-form body (Markdown)"
        htmlFor="body_markdown"
        hint="Anything the structured sections above don't capture."
      >
        <Textarea
          id="body_markdown"
          name="body_markdown"
          dir="auto"
          rows={6}
          defaultValue={v?.body_markdown ?? ""}
        />
      </Field>

      <Field label="Revision note" htmlFor="revision_note">
        <Input
          id="revision_note"
          name="revision_note"
          dir="auto"
          defaultValue={v?.revision_note ?? ""}
          placeholder="What changed since the last version?"
        />
      </Field>

      {!constitution ? (
        <label className="text-ink flex items-center gap-2 text-sm">
          <input type="checkbox" name="make_current" className="accent-accent-soft" />
          Make this the current version
        </label>
      ) : null}

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

      <div className="flex justify-end gap-3">
        <Link
          href="/book"
          className="text-ink-muted hover:bg-surface-2 rounded-md px-4 py-2 text-sm"
        >
          Cancel
        </Link>
        <SubmitButton pendingText="Saving…">
          {constitution ? "Save version" : "Create version"}
        </SubmitButton>
      </div>
    </form>
  );
}
