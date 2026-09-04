import type { Metadata } from "next";
import { getAuthedContext } from "@/lib/auth/session";
import { CardForm } from "@/components/cards/card-form";

export const metadata: Metadata = { title: "New card — Rangkhaneh" };

export default async function NewCardPage() {
  const { supabase } = await getAuthedContext();
  const { data: sources } = await supabase
    .from("sources")
    .select("id,title")
    .order("title", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-ink font-serif text-2xl font-semibold">New card</h1>
      <CardForm sources={sources ?? []} />
    </div>
  );
}
