"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import {
  constitutionSchema,
  bookSectionSchema,
  cardBookLinkSchema,
} from "@/lib/validation/schemas";
import { fail, fieldErrorsOf, str, type ActionResult } from "@/lib/actions/util";

// ---------------------------------------------------------------------------
// Book Constitution
// ---------------------------------------------------------------------------

function constitutionValues(formData: FormData) {
  return {
    version_name: str(formData, "version_name") ?? "",
    revision_note: str(formData, "revision_note"),
    project_description: str(formData, "project_description"),
    central_questions: str(formData, "central_questions"),
    provisional_thesis: str(formData, "provisional_thesis"),
    counter_theses: str(formData, "counter_theses"),
    accepted_claims: str(formData, "accepted_claims"),
    rejected_claims: str(formData, "rejected_claims"),
    methodology: str(formData, "methodology"),
    ethics: str(formData, "ethics"),
    tone: str(formData, "tone"),
    chapter_outline: str(formData, "chapter_outline"),
    glossary: str(formData, "glossary"),
    known_problems: str(formData, "known_problems"),
    body_markdown: str(formData, "body_markdown"),
  };
}

async function clearCurrent(
  supabase: Awaited<ReturnType<typeof getAuthedContext>>["supabase"],
  ownerId: string,
) {
  await supabase
    .from("book_constitutions")
    .update({ is_current: false })
    .eq("owner_id", ownerId)
    .eq("is_current", true);
}

export async function createConstitutionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = constitutionSchema.safeParse(constitutionValues(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const makeCurrent = formData.get("make_current") === "on";
  if (makeCurrent) await clearCurrent(supabase, user.id);

  const { data, error } = await supabase
    .from("book_constitutions")
    .insert({ ...parsed.data, owner_id: user.id, is_current: makeCurrent })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create version.");
  revalidatePath("/book");
  redirect(`/book/constitution/${data.id}`);
}

export async function updateConstitutionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "constitution_id");
  if (!id) return fail("Missing id.");
  const parsed = constitutionSchema.safeParse(constitutionValues(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { error } = await supabase
    .from("book_constitutions")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  revalidatePath(`/book/constitution/${id}`);
  revalidatePath("/book");
  return { ok: true };
}

export async function setCurrentConstitutionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "constitution_id");
  if (!id) return;
  await clearCurrent(supabase, user.id);
  await supabase
    .from("book_constitutions")
    .update({ is_current: true })
    .eq("id", id)
    .eq("owner_id", user.id);
  revalidatePath("/book");
  revalidatePath(`/book/constitution/${id}`);
  revalidatePath("/home");
}

export async function duplicateConstitutionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "constitution_id");
  if (!id) return;
  const { data: src } = await supabase
    .from("book_constitutions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!src) return;

  const { data: copy } = await supabase
    .from("book_constitutions")
    .insert({
      owner_id: user.id,
      version_name: `${src.version_name} (copy)`,
      is_current: false,
      project_description: src.project_description,
      central_questions: src.central_questions,
      provisional_thesis: src.provisional_thesis,
      counter_theses: src.counter_theses,
      accepted_claims: src.accepted_claims,
      rejected_claims: src.rejected_claims,
      methodology: src.methodology,
      ethics: src.ethics,
      tone: src.tone,
      chapter_outline: src.chapter_outline,
      glossary: src.glossary,
      known_problems: src.known_problems,
      body_markdown: src.body_markdown,
      revision_note: "Duplicated from an earlier version.",
    })
    .select("id")
    .single();
  revalidatePath("/book");
  if (copy) redirect(`/book/constitution/${copy.id}`);
}

// ---------------------------------------------------------------------------
// Book sections (map)
// ---------------------------------------------------------------------------

export async function createSectionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = bookSectionSchema.safeParse({
    title: str(formData, "title") ?? "",
    node_type: str(formData, "node_type"),
    summary: str(formData, "summary"),
    parent_id: str(formData, "parent_id") ?? null,
    constitution_id: str(formData, "constitution_id") ?? null,
  });
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }

  const parentId = parsed.data.parent_id ?? null;
  const siblings = supabase
    .from("book_sections")
    .select("position")
    .eq("owner_id", user.id)
    .order("position", { ascending: false })
    .limit(1);
  const { data: last } = await (
    parentId ? siblings.eq("parent_id", parentId) : siblings.is("parent_id", null)
  ).maybeSingle();
  const nextPos = (last?.position ?? -1) + 1;

  const { error } = await supabase.from("book_sections").insert({
    ...parsed.data,
    owner_id: user.id,
    position: nextPos,
  });
  if (error) return fail(error.message);
  revalidatePath("/book");
  return { ok: true };
}

export async function updateSectionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "section_id");
  if (!id) return fail("Missing id.");
  const parsed = bookSectionSchema.safeParse({
    title: str(formData, "title") ?? "",
    node_type: str(formData, "node_type"),
    summary: str(formData, "summary"),
    parent_id: str(formData, "parent_id") ?? null,
    constitution_id: str(formData, "constitution_id") ?? null,
  });
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { error } = await supabase
    .from("book_sections")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  revalidatePath("/book");
  return { ok: true };
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "section_id");
  if (!id) return;
  await supabase.from("book_sections").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/book");
}

export async function moveSectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "section_id");
  const direction = str(formData, "direction");
  const parentId = str(formData, "parent_id") ?? null;
  if (!id || !direction) return;

  const q = supabase
    .from("book_sections")
    .select("id,position")
    .eq("owner_id", user.id)
    .order("position", { ascending: true });
  const { data: sibs } = await (parentId
    ? q.eq("parent_id", parentId)
    : q.is("parent_id", null));
  if (!sibs) return;

  const index = sibs.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= sibs.length) return;

  const a = sibs[index];
  const b = sibs[swapWith];
  await Promise.all([
    supabase
      .from("book_sections")
      .update({ position: b.position })
      .eq("id", a.id)
      .eq("owner_id", user.id),
    supabase
      .from("book_sections")
      .update({ position: a.position })
      .eq("id", b.id)
      .eq("owner_id", user.id),
  ]);
  revalidatePath("/book");
}

// ---------------------------------------------------------------------------
// Card <-> section links
// ---------------------------------------------------------------------------

export async function linkCardToSectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const parsed = cardBookLinkSchema.safeParse({
    card_id: str(formData, "card_id"),
    section_id: str(formData, "section_id"),
    book_relation: str(formData, "book_relation"),
    intended_use: str(formData, "intended_use"),
    priority: str(formData, "priority") ?? 0,
    rationale: str(formData, "rationale"),
    citation_note: str(formData, "citation_note"),
    excerpt_used: str(formData, "excerpt_used"),
    use_status: str(formData, "use_status"),
  });
  if (!parsed.success) return;
  await supabase
    .from("card_book_links")
    .upsert(
      { ...parsed.data, owner_id: user.id },
      { onConflict: "card_id,section_id" },
    );
  revalidatePath("/book");
  revalidatePath(`/cards/${parsed.data.card_id}`);
}

export async function unlinkCardFromSectionAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const linkId = str(formData, "link_id");
  if (!linkId) return;
  await supabase
    .from("card_book_links")
    .delete()
    .eq("id", linkId)
    .eq("owner_id", user.id);
  revalidatePath("/book");
}
