"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { quickCaptureAction } from "@/app/(app)/capture/actions";
import type { ActionResult } from "@/lib/actions/util";
import { Field } from "@/components/ui/field";
import { Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { CARD_TYPES, CARD_DOMAINS } from "@/lib/constants/vocab";

const DRAFT_KEY = "rk:capture:draft";

export function CaptureForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    quickCaptureAction,
    null,
  );
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  // Preserve an unsaved draft locally so a navigation or network failure never
  // loses captured material.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { content?: string; title?: string };
        setContent(draft.content ?? "");
        setTitle(draft.title ?? "");
      }
    } catch {
      // ignore malformed drafts
    }
  }, []);

  useEffect(() => {
    try {
      if (content || title) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, title }));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // storage may be unavailable; capture still works
    }
  }, [content, title]);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form
      action={(fd) => {
        // Clear the local draft once the submission is handed to the server.
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* noop */
        }
        return formAction(fd);
      }}
    >
      <Field
        label="Content"
        htmlFor="original_content"
        error={fieldErrors?.original_content?.[0]}
      >
        <Textarea
          id="original_content"
          name="original_content"
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or type. Persian and English are both fine."
          className={compact ? "min-h-32" : "min-h-48"}
          autoFocus
        />
      </Field>

      <Field label="Title (optional)" htmlFor="title">
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          dir="auto"
          placeholder="Left blank, a title is suggested from the content."
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type" htmlFor="card_type">
          <Select id="card_type" name="card_type" defaultValue="research_note">
            {CARD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Domain" htmlFor="domain">
          <Select id="domain" name="domain" defaultValue="research">
            {CARD_DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.en}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Source URL (optional)"
        htmlFor="source_url"
        hint="Stored as source metadata. Not fetched in Phase 1."
      >
        <Input
          id="source_url"
          name="source_url"
          type="url"
          dir="ltr"
          placeholder="https://…"
        />
      </Field>

      {state && !state.ok ? (
        <p role="alert" className="text-danger mb-3 text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save to Inbox</SubmitButton>
      </div>
    </form>
  );
}
