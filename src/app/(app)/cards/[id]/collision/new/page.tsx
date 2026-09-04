import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { CollisionForm } from "@/components/cards/collision-form";
import { ManualProvider } from "@/lib/analysis/provider";

export const metadata: Metadata = { title: "Test against the book — Rangkhaneh" };

const CARD_FIELDS =
  "id,title,domain,card_type,original_content,working_content,exact_quote,paraphrase,translation,summary";
const CONSTITUTION_FIELDS =
  "id,version_name,is_current,project_description,central_questions,provisional_thesis,counter_theses,accepted_claims,rejected_claims,body_markdown";

export default async function NewCollisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAuthedContext();

  const { data: card } = await supabase
    .from("cards")
    .select(CARD_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (!card) notFound();

  const { data: constitutions } = await supabase
    .from("book_constitutions")
    .select(CONSTITUTION_FIELDS)
    .order("created_at", { ascending: false });

  const list = constitutions ?? [];
  const current = list.find((c) => c.is_current) ?? null;
  const aiPrompt = ManualProvider.buildCollisionPrompt({
    card,
    constitution: current,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/cards/${id}`} className="text-lapis text-sm hover:underline">
          ← Back to card
        </Link>
        <h1 className="text-ink mt-2 font-serif text-2xl font-semibold">
          Test against the book
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          A structured comparison between one card and one version of the Book
          Constitution. Fill in what you can — nothing is required.
        </p>
      </div>
      <CollisionForm
        cardId={id}
        constitutions={list.map((c) => ({
          id: c.id,
          version_name: c.version_name,
          is_current: c.is_current,
        }))}
        defaultConstitutionId={current?.id ?? null}
        aiPrompt={aiPrompt}
      />
    </div>
  );
}
