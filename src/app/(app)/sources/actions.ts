"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { sourceSchema } from "@/lib/validation/schemas";
import { fail, fieldErrorsOf, str, type ActionResult } from "@/lib/actions/util";

function valuesFrom(formData: FormData) {
  return {
    title: str(formData, "title") ?? "",
    source_type: str(formData, "source_type"),
    author: str(formData, "author"),
    publication: str(formData, "publication"),
    publisher: str(formData, "publisher"),
    url: str(formData, "url") ?? "",
    archive: str(formData, "archive"),
    identifier: str(formData, "identifier"),
    identifier_type: str(formData, "identifier_type"),
    publication_date_label: str(formData, "publication_date_label"),
    access_date: str(formData, "access_date") ?? "",
    rights_status: str(formData, "rights_status"),
    reliability_note: str(formData, "reliability_note"),
    notes: str(formData, "notes"),
  };
}

export async function createSourceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = sourceSchema.safeParse(valuesFrom(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { error } = await supabase
    .from("sources")
    .insert({ ...parsed.data, owner_id: user.id });
  if (error) return fail(error.message);
  revalidatePath("/sources");
  redirect("/sources");
}

export async function updateSourceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "source_id");
  if (!id) return fail("Missing source id.");
  const parsed = sourceSchema.safeParse(valuesFrom(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { error } = await supabase
    .from("sources")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  revalidatePath("/sources");
  redirect("/sources");
}

export async function deleteSourceAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "source_id");
  if (!id) return;
  await supabase.from("sources").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/sources");
}
