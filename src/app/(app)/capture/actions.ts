"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { quickCaptureSchema } from "@/lib/validation/schemas";
import {
  fail,
  fieldErrorsOf,
  suggestTitle,
  type ActionResult,
} from "@/lib/actions/util";

/**
 * Capture is intentionally forgiving: content alone is enough, capture time is
 * recorded automatically, and the card lands in the Inbox. A pasted URL is
 * stored as source metadata (no scraping in Phase 1).
 */
export async function quickCaptureAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();

  const parsed = quickCaptureSchema.safeParse({
    original_content: formData.get("original_content") ?? "",
    title: formData.get("title") ?? undefined,
    card_type: formData.get("card_type") ?? undefined,
    domain: formData.get("domain") ?? undefined,
    source_url: formData.get("source_url") ?? undefined,
  });

  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const data = parsed.data;

  if (!data.original_content && !data.title) {
    return fail("Add some content or a title before saving.");
  }

  let sourceId: string | null = null;
  if (data.source_url) {
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .insert({
        owner_id: user.id,
        title: data.source_url,
        source_type: "website",
        url: data.source_url,
      })
      .select("id")
      .single();
    if (!sourceError && source) sourceId = source.id;
  }

  const title =
    data.title ??
    (data.original_content ? suggestTitle(data.original_content) : "Untitled card");

  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      owner_id: user.id,
      original_content: data.original_content,
      title,
      domain: data.domain ?? "research",
      card_type: data.card_type ?? "research_note",
      workflow_status: "inbox",
      epistemic_status: "unreviewed",
      source_id: sourceId,
    })
    .select("id")
    .single();

  if (error || !card) {
    return fail(error?.message ?? "Could not save the card.");
  }

  revalidatePath("/inbox");
  revalidatePath("/home");
  revalidatePath("/archive");
  redirect(`/cards/${card.id}`);
}
