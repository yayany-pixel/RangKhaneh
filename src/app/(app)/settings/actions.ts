"use server";

import { revalidatePath } from "next/cache";
import { getAuthedContext } from "@/lib/auth/session";
import { facetSchema } from "@/lib/validation/schemas";
import { fail, fieldErrorsOf, str, type ActionResult } from "@/lib/actions/util";

function parseAliases(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50),
    ),
  );
}

function facetValues(formData: FormData) {
  return {
    facet_type: str(formData, "facet_type") ?? "custom",
    label_en: str(formData, "label_en"),
    label_fa: str(formData, "label_fa"),
    description: str(formData, "description"),
    aliases: parseAliases(str(formData, "aliases")),
  };
}

async function replaceAliases(
  supabase: Awaited<ReturnType<typeof getAuthedContext>>["supabase"],
  ownerId: string,
  facetId: string,
  aliases: string[],
) {
  await supabase.from("facet_aliases").delete().eq("facet_id", facetId);
  if (aliases.length) {
    await supabase
      .from("facet_aliases")
      .insert(
        aliases.map((alias) => ({ owner_id: ownerId, facet_id: facetId, alias })),
      );
  }
}

export async function createFacetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = facetSchema.safeParse(facetValues(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { aliases, ...facet } = parsed.data;
  const { data, error } = await supabase
    .from("facets")
    .insert({ ...facet, owner_id: user.id })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create facet.");
  await replaceAliases(supabase, user.id, data.id, aliases);
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateFacetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "facet_id");
  if (!id) return fail("Missing id.");
  const parsed = facetSchema.safeParse(facetValues(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const { aliases, ...facet } = parsed.data;
  const { error } = await supabase
    .from("facets")
    .update(facet)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  await replaceAliases(supabase, user.id, id, aliases);
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteFacetAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "facet_id");
  if (!id) return;
  await supabase.from("facets").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/settings");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "tag_id");
  if (!id) return;
  await supabase.from("tags").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/settings");
}

export async function setAiEnabledAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const enabled = formData.get("ai_enabled") === "on";
  await supabase
    .from("user_settings")
    .upsert({ owner_id: user.id, ai_enabled: enabled }, { onConflict: "owner_id" });
  revalidatePath("/settings");
}
