import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { CardForm } from "@/components/cards/card-form";

export const metadata: Metadata = { title: "Edit card — Rangkhaneh" };

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAuthedContext();

  const [{ data: card }, { data: sources }] = await Promise.all([
    supabase.from("cards").select("*").eq("id", id).maybeSingle(),
    supabase.from("sources").select("id,title").order("title", { ascending: true }),
  ]);

  if (!card) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-ink font-serif text-2xl font-semibold">Edit card</h1>
      <CardForm card={card} sources={sources ?? []} />
    </div>
  );
}
