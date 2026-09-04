"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { cardSchema } from "@/lib/validation/schemas";
import {
  fail,
  ok,
  fieldErrorsOf,
  suggestTitle,
  str,
  type ActionResult,
} from "@/lib/actions/util";

function parseList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function cardValuesFromForm(formData: FormData) {
  return {
    title: str(formData, "title") ?? "",
    domain: str(formData, "domain"),
    card_type: str(formData, "card_type"),
    workflow_status: str(formData, "workflow_status"),
    epistemic_status: str(formData, "epistemic_status"),
    book_relation: str(formData, "book_relation"),

    original_content: (formData.get("original_content") as string) ?? "",
    working_content: str(formData, "working_content"),
    exact_quote: str(formData, "exact_quote"),
    paraphrase: str(formData, "paraphrase"),
    translation: str(formData, "translation"),
    transliteration: str(formData, "transliteration"),
    summary: str(formData, "summary"),
    annotation: str(formData, "annotation"),
    questions: str(formData, "questions"),
    why_it_matters: str(formData, "why_it_matters"),

    language_codes: parseList(formData.get("language_codes")),
    original_language: str(formData, "original_language"),
    translation_language: str(formData, "translation_language"),

    source_id: str(formData, "source_id") ?? null,
    source_locator: str(formData, "source_locator"),
    provenance_note: str(formData, "provenance_note"),
    rights_status: str(formData, "rights_status"),
    reliability_note: str(formData, "reliability_note"),

    historical_date_label: str(formData, "historical_date_label"),
    historical_start_year: formData.get("historical_start_year") ?? "",
    historical_end_year: formData.get("historical_end_year") ?? "",
    date_precision: str(formData, "date_precision"),
    calendar_system: str(formData, "calendar_system"),

    is_favorite: formData.get("is_favorite") === "on",
  };
}

export async function createCardAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = cardSchema.safeParse(cardValuesFromForm(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const v = parsed.data;
  const title = v.title || suggestTitle(v.original_content);

  const { data: card, error } = await supabase
    .from("cards")
    .insert({ ...v, title, owner_id: user.id })
    .select("id")
    .single();

  if (error || !card) return fail(error?.message ?? "Could not create the card.");

  revalidatePath("/archive");
  revalidatePath("/inbox");
  revalidatePath("/home");
  redirect(`/cards/${card.id}`);
}

export async function updateCardAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  if (!cardId) return fail("Missing card id.");

  const parsed = cardSchema.safeParse(cardValuesFromForm(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const v = parsed.data;
  const title = v.title || suggestTitle(v.original_content);

  const { error } = await supabase
    .from("cards")
    .update({ ...v, title })
    .eq("id", cardId)
    .eq("owner_id", user.id);

  if (error) return fail(error.message);

  revalidatePath(`/cards/${cardId}`);
  revalidatePath("/archive");
  redirect(`/cards/${cardId}`);
}

// --- Small, direct form actions -------------------------------------------

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const next = formData.get("value") === "true";
  if (!cardId) return;
  await supabase
    .from("cards")
    .update({ is_favorite: next })
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}`);
  revalidatePath("/archive");
}

export async function setWorkflowStatusAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const status = str(formData, "workflow_status");
  if (!cardId || !status) return;
  await supabase
    .from("cards")
    .update({ workflow_status: status })
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}`);
  revalidatePath("/inbox");
  revalidatePath("/home");
}

export async function setReviewedAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  if (!cardId) return;
  await supabase
    .from("cards")
    .update({ last_reviewed_at: new Date().toISOString() })
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}`);
}

export async function scheduleReviewAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const when = str(formData, "next_review_at");
  if (!cardId) return;
  await supabase
    .from("cards")
    .update({ next_review_at: when ? new Date(when).toISOString() : null })
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}`);
  revalidatePath("/home");
}

export async function softDeleteCardAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  if (!cardId) return;
  await supabase
    .from("cards")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath("/archive");
  revalidatePath("/trash");
  redirect("/archive");
}

export async function restoreCardAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  if (!cardId) return;
  await supabase
    .from("cards")
    .update({ deleted_at: null })
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath("/trash");
  revalidatePath("/archive");
  revalidatePath(`/cards/${cardId}`);
}

export async function purgeCardAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  if (!cardId) return;
  await supabase.from("cards").delete().eq("id", cardId).eq("owner_id", user.id);
  revalidatePath("/trash");
  redirect("/trash");
}

// --- Tags & facets ---------------------------------------------------------

export async function addTagAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const label = str(formData, "label");
  if (!cardId || !label) return fail("A tag label is required.");

  const { normalizeTag } = await import("@/lib/search/normalize");
  const normalized = normalizeTag(label);

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("owner_id", user.id)
    .eq("normalized", normalized)
    .maybeSingle();

  let tagId = existing?.id;
  if (!tagId) {
    const { data: created, error } = await supabase
      .from("tags")
      .insert({ owner_id: user.id, label, normalized })
      .select("id")
      .single();
    if (error || !created) return fail(error?.message ?? "Could not create tag.");
    tagId = created.id;
  }

  await supabase
    .from("card_tags")
    .insert({ owner_id: user.id, card_id: cardId, tag_id: tagId });
  revalidatePath(`/cards/${cardId}`);
  return ok();
}

export async function removeTagAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const tagId = str(formData, "tag_id");
  if (!cardId || !tagId) return;
  await supabase
    .from("card_tags")
    .delete()
    .eq("owner_id", user.id)
    .eq("card_id", cardId)
    .eq("tag_id", tagId);
  revalidatePath(`/cards/${cardId}`);
}

export async function addFacetAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const facetId = str(formData, "facet_id");
  if (!cardId || !facetId) return;
  await supabase
    .from("card_facets")
    .insert({ owner_id: user.id, card_id: cardId, facet_id: facetId });
  revalidatePath(`/cards/${cardId}`);
}

export async function removeFacetAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const facetId = str(formData, "facet_id");
  if (!cardId || !facetId) return;
  await supabase
    .from("card_facets")
    .delete()
    .eq("owner_id", user.id)
    .eq("card_id", cardId)
    .eq("facet_id", facetId);
  revalidatePath(`/cards/${cardId}`);
}

// --- Relations -------------------------------------------------------------

export async function addRelationAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const from = str(formData, "from_card_id");
  const to = str(formData, "to_card_id");
  const type = str(formData, "relation_type") ?? "related";
  if (!from || !to || from === to) return;
  await supabase.from("card_relations").insert({
    owner_id: user.id,
    from_card_id: from,
    to_card_id: to,
    relation_type: type,
    note: str(formData, "note") ?? null,
  });
  revalidatePath(`/cards/${from}`);
}

export async function removeRelationAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "relation_id");
  const cardId = str(formData, "card_id");
  if (!id) return;
  await supabase.from("card_relations").delete().eq("owner_id", user.id).eq("id", id);
  if (cardId) revalidatePath(`/cards/${cardId}`);
}

// --- Revisions -------------------------------------------------------------

export async function restoreRevisionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const revisionId = str(formData, "revision_id");
  const cardId = str(formData, "card_id");
  if (!revisionId || !cardId) return;

  const { data: rev } = await supabase
    .from("card_revisions")
    .select("snapshot")
    .eq("id", revisionId)
    .eq("owner_id", user.id)
    .single();
  if (!rev) return;

  const snap = rev.snapshot as Record<string, unknown>;
  const restorable = { ...snap };
  delete restorable.id;
  delete restorable.owner_id;
  delete restorable.created_at;
  delete restorable.updated_at;
  delete restorable.search_all;
  delete restorable.search_related;
  delete restorable.search_tsv;

  await supabase
    .from("cards")
    .update(restorable)
    .eq("id", cardId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}`);
}
