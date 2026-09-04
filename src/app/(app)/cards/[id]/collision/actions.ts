"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { collisionReportSchema } from "@/lib/validation/schemas";
import { fail, fieldErrorsOf, str, type ActionResult } from "@/lib/actions/util";
import type { Database } from "@/lib/supabase/database.types";

type CollisionStatus = Database["public"]["Enums"]["collision_status"];

function collisionValues(formData: FormData) {
  return {
    card_id: str(formData, "card_id"),
    constitution_id: str(formData, "constitution_id") ?? null,
    what_it_says: str(formData, "what_it_says"),
    extracted_units: str(formData, "extracted_units"),
    evidence_vs_interpretation: str(formData, "evidence_vs_interpretation"),
    missing_verification: str(formData, "missing_verification"),
    agreements: str(formData, "agreements"),
    contradictions: str(formData, "contradictions"),
    complications: str(formData, "complications"),
    forcing_risk: str(formData, "forcing_risk"),
    possible_uses: str(formData, "possible_uses"),
    placement_suggestions: str(formData, "placement_suggestions"),
    independent_uses: str(formData, "independent_uses"),
    verification_tasks: str(formData, "verification_tasks"),
    related_card_queries: str(formData, "related_card_queries"),
    warnings: str(formData, "warnings"),
    confidence: str(formData, "confidence"),
    verdict: str(formData, "verdict") ?? null,
    human_rationale: str(formData, "human_rationale"),
  };
}

function statusFromIntent(formData: FormData): CollisionStatus {
  return formData.get("intent") === "complete" ? "complete" : "draft";
}

export async function createCollisionReportAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const parsed = collisionReportSchema.safeParse(collisionValues(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const status = statusFromIntent(formData);
  const { data, error } = await supabase
    .from("collision_reports")
    .insert({
      ...parsed.data,
      owner_id: user.id,
      authorship: "manual",
      status,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not save report.");
  revalidatePath(`/cards/${parsed.data.card_id}`);
  redirect(`/cards/${parsed.data.card_id}/collision/${data.id}`);
}

export async function updateCollisionReportAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthedContext();
  const id = str(formData, "report_id");
  if (!id) return fail("Missing id.");
  const parsed = collisionReportSchema.safeParse(collisionValues(formData));
  if (!parsed.success) {
    return fail("Please check the form.", fieldErrorsOf(parsed.error));
  }
  const status = statusFromIntent(formData);
  const { error } = await supabase
    .from("collision_reports")
    .update({ ...parsed.data, status })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  revalidatePath(`/cards/${parsed.data.card_id}`);
  revalidatePath(`/cards/${parsed.data.card_id}/collision/${id}`);
  return { ok: true };
}

export async function retestCollisionReportAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const reportId = str(formData, "report_id");
  if (!cardId || !reportId) return;
  const { data: current } = await supabase
    .from("book_constitutions")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_current", true)
    .maybeSingle();
  await supabase
    .from("collision_reports")
    .update({ constitution_id: current?.id ?? null, status: "draft" })
    .eq("id", reportId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}/collision/${reportId}`);
}

export async function deleteCollisionReportAction(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthedContext();
  const cardId = str(formData, "card_id");
  const reportId = str(formData, "report_id");
  if (!reportId) return;
  await supabase
    .from("collision_reports")
    .delete()
    .eq("id", reportId)
    .eq("owner_id", user.id);
  revalidatePath(`/cards/${cardId}`);
  redirect(`/cards/${cardId}`);
}
