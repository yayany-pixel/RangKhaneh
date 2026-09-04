"use client";

import { useActionState, useState } from "react";
import {
  uploadAttachmentAction,
  updateAttachmentAction,
  deleteAttachmentAction,
} from "@/app/(app)/cards/[id]/attachments/actions";
import type { ActionResult } from "@/lib/actions/util";
import type { AttachmentRow } from "@/lib/supabase/database.types";
import { Field } from "@/components/ui/field";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import { ATTACHMENT_KINDS, labelOf } from "@/lib/constants/vocab";

function AttachmentItem({
  attachment,
  cardId,
}: {
  attachment: AttachmentRow;
  cardId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateAttachmentAction,
    null,
  );
  const href = `/api/attachments/${attachment.id}`;
  const isImage = (attachment.mime_type ?? "").startsWith("image/");

  return (
    <li className="border-border bg-surface rounded-lg border p-4">
      <div className="flex gap-4">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={href}
            alt={attachment.caption ?? attachment.original_filename}
            className="border-border h-20 w-20 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div className="border-border bg-surface-2 text-ink-faint flex h-20 w-20 shrink-0 items-center justify-center rounded-md border text-xs">
            {labelOf(ATTACHMENT_KINDS, attachment.kind) || "File"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p dir="auto" className="text-ink truncate font-medium">
            {attachment.original_filename}
          </p>
          <p className="text-ink-faint text-xs">
            <Badge tone="neutral">{labelOf(ATTACHMENT_KINDS, attachment.kind)}</Badge>{" "}
            {attachment.mime_type ?? "unknown"}
            {attachment.byte_size ? ` · ${formatBytes(attachment.byte_size)}` : ""}
          </p>
          {attachment.caption ? (
            <p dir="auto" className="text-ink-muted mt-1 text-sm">
              {attachment.caption}
            </p>
          ) : null}
          {attachment.extracted_text ? (
            <details className="mt-1">
              <summary className="text-ink-muted cursor-pointer text-xs">
                Extracted / transcribed text
              </summary>
              <p dir="auto" className="text-ink mt-1 text-sm whitespace-pre-wrap">
                {attachment.extracted_text}
              </p>
            </details>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lapis hover:underline"
            >
              Download
            </a>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="text-ink-muted hover:underline"
            >
              {editing ? "Close" : "Edit"}
            </button>
            <form action={deleteAttachmentAction}>
              <input type="hidden" name="attachment_id" value={attachment.id} />
              <input type="hidden" name="card_id" value={cardId} />
              <ConfirmSubmit
                size="sm"
                variant="ghost"
                message="Delete this attachment and its file? This cannot be undone."
                className="text-danger"
              >
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        </div>
      </div>

      {editing ? (
        <form
          action={formAction}
          className="border-border mt-3 space-y-3 border-t pt-3"
        >
          <input type="hidden" name="attachment_id" value={attachment.id} />
          <input type="hidden" name="card_id" value={cardId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kind" htmlFor={`kind-${attachment.id}`}>
              <Select
                id={`kind-${attachment.id}`}
                name="kind"
                defaultValue={attachment.kind}
              >
                {ATTACHMENT_KINDS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.en}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Caption" htmlFor={`caption-${attachment.id}`}>
              <Input
                id={`caption-${attachment.id}`}
                name="caption"
                dir="auto"
                defaultValue={attachment.caption ?? ""}
              />
            </Field>
          </div>
          <Field
            label="Extracted / transcribed text"
            htmlFor={`extracted-${attachment.id}`}
            hint="Stored separately from the original file — never overwrites it."
          >
            <Textarea
              id={`extracted-${attachment.id}`}
              name="extracted_text"
              dir="auto"
              rows={4}
              defaultValue={attachment.extracted_text ?? ""}
            />
          </Field>
          {state && !state.ok ? (
            <p role="alert" className="text-danger text-sm">
              {state.error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save details</SubmitButton>
          </div>
        </form>
      ) : null}
    </li>
  );
}

export function AttachmentManager({
  cardId,
  attachments,
}: {
  cardId: string;
  attachments: AttachmentRow[];
}) {
  return (
    <div className="space-y-4">
      <form
        action={uploadAttachmentAction}
        className="border-border bg-surface flex flex-wrap items-end gap-3 rounded-lg border p-4"
      >
        <input type="hidden" name="card_id" value={cardId} />
        <div className="flex-1">
          <label htmlFor="file" className="text-ink mb-1 block text-sm font-medium">
            Add an attachment
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            className="text-ink file:bg-surface-2 file:text-ink block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="upload-caption"
            className="text-ink mb-1 block text-sm font-medium"
          >
            Caption (optional)
          </label>
          <Input id="upload-caption" name="caption" dir="auto" />
        </div>
        <Button type="submit" variant="secondary">
          Upload
        </Button>
      </form>

      {attachments.length ? (
        <ul className="space-y-3">
          {attachments.map((a) => (
            <AttachmentItem key={a.id} attachment={a} cardId={cardId} />
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted text-sm">
          No attachments yet. Images, PDFs, audio, and handwriting scans are stored
          privately; the original file is always preserved.
        </p>
      )}
    </div>
  );
}
