"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthedContext } from "@/lib/auth/session";
import { fail, fieldErrorsOf, str, type ActionResult } from "@/lib/actions/util";
import { attachmentMetaSchema } from "@/lib/validation/schemas";

const BUCKET = "attachments";

function kindFromMime(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("text/")) return "text";
  if (mime.startsWith("audio/")) return "audio";
  return "other";
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "file";
}

export async function uploadAttachmentAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const file = formData.get("file");
  if (!cardId || !(file instanceof File) || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
  const path = `${user.id}/${cardId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const mime = file.type || "application/octet-stream";

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (upErr) return;

  const { error: rowErr } = await supabase.from("attachments").insert({
    owner_id: user.id,
    card_id: cardId,
    kind: kindFromMime(mime),
    storage_path: path,
    original_filename: file.name,
    mime_type: mime,
    byte_size: file.size,
    checksum,
    caption: str(formData, "caption") ?? null,
  });
  if (rowErr) {
    // Roll back the uploaded object so we never orphan storage on a failed row.
    await supabase.storage.from(BUCKET).remove([path]);
    return;
  }
  revalidatePath(`/cards/${cardId}`);
}

export async function updateAttachmentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "attachment_id");
  const cardId = str(formData, "card_id");
  if (!id) return fail("Missing id.");
  const parsed = attachmentMetaSchema.safeParse({
    kind: str(formData, "kind"),
    caption: str(formData, "caption"),
    extracted_text: str(formData, "extracted_text"),
  });
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { error } = await supabase
    .from("attachments")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  if (cardId) revalidatePath(`/cards/${cardId}`);
  return { ok: true };
}

export async function deleteAttachmentAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "attachment_id");
  const cardId = str(formData, "card_id");
  if (!id) return;
  const { data: row } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
  }
  await supabase.from("attachments").delete().eq("id", id).eq("owner_id", user.id);
  if (cardId) revalidatePath(`/cards/${cardId}`);
}
