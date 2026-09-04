"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { collectionSchema } from "@/lib/validation/schemas";
import { fail, fieldErrorsOf, str, type ActionResult } from "@/lib/actions/util";

export async function createCollectionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = collectionSchema.safeParse({
    title: str(formData, "title") ?? "",
    description: str(formData, "description"),
  });
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { data, error } = await supabase
    .from("collections")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create collection.");
  revalidatePath("/collections");
  redirect(`/collections/${data.id}`);
}

export async function updateCollectionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "collection_id");
  if (!id) return fail("Missing collection id.");
  const parsed = collectionSchema.safeParse({
    title: str(formData, "title") ?? "",
    description: str(formData, "description"),
  });
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { error } = await supabase
    .from("collections")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  revalidatePath(`/collections/${id}`);
  revalidatePath("/collections");
  return { ok: true };
}

export async function archiveCollectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "collection_id");
  const value = formData.get("value") === "true";
  if (!id) return;
  await supabase
    .from("collections")
    .update({ is_archived: value })
    .eq("id", id)
    .eq("owner_id", user.id);
  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "collection_id");
  if (!id) return;
  await supabase.from("collections").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/collections");
  redirect("/collections");
}

export async function addCardToCollectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const collectionId = str(formData, "collection_id");
  const cardId = str(formData, "card_id");
  if (!collectionId || !cardId) return;

  const { data: last } = await supabase
    .from("collection_cards")
    .select("position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (last?.position ?? -1) + 1;

  await supabase.from("collection_cards").insert({
    owner_id: user.id,
    collection_id: collectionId,
    card_id: cardId,
    position: nextPos,
  });
  revalidatePath(`/collections/${collectionId}`);
}

export async function removeCardFromCollectionAction(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const collectionId = str(formData, "collection_id");
  const cardId = str(formData, "card_id");
  if (!collectionId || !cardId) return;
  await supabase
    .from("collection_cards")
    .delete()
    .eq("owner_id", user.id)
    .eq("collection_id", collectionId)
    .eq("card_id", cardId);
  revalidatePath(`/collections/${collectionId}`);
}

export async function moveCollectionCardAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const collectionId = str(formData, "collection_id");
  const cardId = str(formData, "card_id");
  const direction = str(formData, "direction");
  if (!collectionId || !cardId || !direction) return;

  const { data: items } = await supabase
    .from("collection_cards")
    .select("card_id,position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: true });
  if (!items) return;

  const index = items.findIndex((i) => i.card_id === cardId);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= items.length) return;

  const a = items[index];
  const b = items[swapWith];
  await Promise.all([
    supabase
      .from("collection_cards")
      .update({ position: b.position })
      .eq("collection_id", collectionId)
      .eq("card_id", a.card_id)
      .eq("owner_id", user.id),
    supabase
      .from("collection_cards")
      .update({ position: a.position })
      .eq("collection_id", collectionId)
      .eq("card_id", b.card_id)
      .eq("owner_id", user.id),
  ]);
  revalidatePath(`/collections/${collectionId}`);
}
