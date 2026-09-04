import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { SourceForm } from "@/components/sources/source-form";

export const metadata: Metadata = { title: "Edit source — Rangkhaneh" };

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAuthedContext();
  const { data: source } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!source) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-ink font-serif text-2xl font-semibold">Edit source</h1>
      <SourceForm source={source} />
    </div>
  );
}
