"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import {
  createCollisionReportAction,
  updateCollisionReportAction,
} from "@/app/(app)/cards/[id]/collision/actions";
import type { ActionResult } from "@/lib/actions/util";
import type { CollisionReportRow } from "@/lib/supabase/database.types";
import { ManualProvider } from "@/lib/analysis/provider";
import { Field } from "@/components/ui/field";
import { Textarea, Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COLLISION_VERDICTS } from "@/lib/constants/vocab";

type ConstitutionOption = { id: string; version_name: string; is_current: boolean };

const PROMPTS: { name: keyof CollisionReportRow; label: string; hint?: string }[] = [
  { name: "what_it_says", label: "What is this card actually saying or doing?" },
  {
    name: "extracted_units",
    label: "Atomic claims, images, metaphors, or questions",
  },
  {
    name: "evidence_vs_interpretation",
    label: "What is evidence, what is interpretation, and what is invention?",
  },
  {
    name: "missing_verification",
    label: "What provenance or verification is missing?",
  },
  { name: "agreements", label: "Where does it agree with the current book?" },
  { name: "contradictions", label: "Where does it contradict the book?" },
  {
    name: "complications",
    label: "Where does it complicate or destabilize the book?",
  },
  {
    name: "forcing_risk",
    label: "Are we forcing a fit because the material is attractive?",
  },
  {
    name: "possible_uses",
    label: "Possible uses",
    hint: "epigraph, example, counterexample, footnote, transition, image, method, independent essay…",
  },
  {
    name: "placement_suggestions",
    label: "Which chapter or section could use it, and in what role?",
  },
  {
    name: "independent_uses",
    label: "If it does not fit, why is it still worth keeping?",
  },
  { name: "verification_tasks", label: "What research tasks follow from it?" },
  {
    name: "related_card_queries",
    label: "What existing cards should be searched for or linked?",
  },
  { name: "warnings", label: "Warnings" },
];

export function CollisionForm({
  cardId,
  report,
  constitutions,
  defaultConstitutionId,
  aiPrompt,
}: {
  cardId: string;
  report?: CollisionReportRow;
  constitutions: ConstitutionOption[];
  defaultConstitutionId: string | null;
  aiPrompt: string;
}) {
  const action = report ? updateCollisionReportAction : createCollisionReportAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const v = report;

  function applySuggestion() {
    const result = ManualProvider.parseSuggestion(pasteValue);
    if (!result.ok) {
      setPasteMsg(result.error);
      return;
    }
    const form = formRef.current;
    if (!form) return;
    let filled = 0;
    for (const [key, value] of Object.entries(result.value)) {
      if (value === undefined) continue;
      const el = form.elements.namedItem(key) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (el) {
        el.value = String(value);
        filled += 1;
      }
    }
    setPasteMsg(
      `Filled ${filled} field(s) from the pasted suggestion. This is an AI draft — review and edit before saving. Nothing is saved until you click a button below.`,
    );
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-border bg-surface space-y-5 rounded-lg border p-5"
    >
      <input type="hidden" name="card_id" value={cardId} />
      {report ? <input type="hidden" name="report_id" value={report.id} /> : null}

      <Field
        label="Book Constitution version"
        htmlFor="constitution_id"
        hint="Every report is tied to one version. Old reports stay intact when the current version changes."
      >
        <Select
          id="constitution_id"
          name="constitution_id"
          defaultValue={v?.constitution_id ?? defaultConstitutionId ?? ""}
        >
          <option value="">— none —</option>
          {constitutions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.version_name}
              {c.is_current ? " (current)" : ""}
            </option>
          ))}
        </Select>
      </Field>

      {PROMPTS.map((p) => (
        <Field key={p.name} label={p.label} htmlFor={p.name} hint={p.hint}>
          <Textarea
            id={p.name}
            name={p.name}
            dir="auto"
            rows={2}
            defaultValue={(v?.[p.name] as string | null) ?? ""}
          />
        </Field>
      ))}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Human verdict" htmlFor="verdict">
          <Select id="verdict" name="verdict" defaultValue={v?.verdict ?? ""}>
            <option value="">— undecided —</option>
            {COLLISION_VERDICTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Confidence (0–100)"
          htmlFor="confidence"
          error={fe?.confidence?.[0]}
        >
          <Input
            id="confidence"
            name="confidence"
            type="number"
            min={0}
            max={100}
            defaultValue={v?.confidence ?? ""}
          />
        </Field>
      </div>

      <Field label="Verdict rationale" htmlFor="human_rationale">
        <Textarea
          id="human_rationale"
          name="human_rationale"
          dir="auto"
          rows={3}
          defaultValue={v?.human_rationale ?? ""}
        />
      </Field>

      <details className="border-border-strong bg-surface-2 rounded-md border p-4">
        <summary className="text-ink cursor-pointer text-sm font-medium">
          Optional AI assistance (manual, provider-neutral)
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-ink-muted text-xs">
            AI is disabled by default. Nothing here sends your data anywhere. Copy the
            prompt into a tool of your choice, then paste the JSON reply back for
            review. AI drafts never overwrite saved content automatically.
          </p>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-ink text-xs font-medium">Copyable prompt</span>
              <Button type="button" size="sm" variant="outline" onClick={copyPrompt}>
                {copied ? "Copied" : "Copy prompt"}
              </Button>
            </div>
            <Textarea
              readOnly
              rows={4}
              value={aiPrompt}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <label
              htmlFor="ai_paste"
              className="text-ink mb-1 block text-xs font-medium"
            >
              Paste a JSON suggestion
            </label>
            <Textarea
              id="ai_paste"
              rows={4}
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              className="font-mono text-xs"
              placeholder='{"what_it_says": "…", "agreements": "…"}'
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={applySuggestion}
              >
                Apply to form for review
              </Button>
              {pasteMsg ? (
                <span className="text-ink-muted text-xs">{pasteMsg}</span>
              ) : null}
            </div>
          </div>
        </div>
      </details>

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

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href={`/cards/${cardId}`}
          className="text-ink-muted hover:bg-surface-2 rounded-md px-4 py-2 text-sm"
        >
          Cancel
        </Link>
        <Button type="submit" name="intent" value="draft" variant="secondary">
          Save draft
        </Button>
        <Button type="submit" name="intent" value="complete">
          Mark complete
        </Button>
      </div>
    </form>
  );
}
