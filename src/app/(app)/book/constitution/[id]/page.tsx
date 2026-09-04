import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { ConstitutionForm } from "@/components/book/constitution-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { BookConstitutionRow } from "@/lib/supabase/database.types";
import {
  setCurrentConstitutionAction,
  duplicateConstitutionAction,
} from "@/app/(app)/book/actions";

export const metadata: Metadata = { title: "Constitution — Rangkhaneh" };

export default async function ConstitutionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAuthedContext();

  const { data: constitution } = await supabase
    .from("book_constitutions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!constitution) notFound();

  const { data: reports } = await supabase
    .from("collision_reports")
    .select("id,card_id,status,created_at")
    .eq("constitution_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/book" className="text-lapis text-sm hover:underline">
            ← Back to book
          </Link>
          <h1 className="text-ink mt-2 flex items-center gap-2 font-serif text-2xl font-semibold">
            <span dir="auto">{constitution.version_name}</span>
            {constitution.is_current ? <Badge tone="verdigris">Current</Badge> : null}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Created {formatDate(constitution.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!constitution.is_current ? (
            <form action={setCurrentConstitutionAction}>
              <input type="hidden" name="constitution_id" value={constitution.id} />
              <button
                type="submit"
                className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
              >
                Make current
              </button>
            </form>
          ) : null}
          <form action={duplicateConstitutionAction}>
            <input type="hidden" name="constitution_id" value={constitution.id} />
            <button
              type="submit"
              className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
            >
              Duplicate
            </button>
          </form>
        </div>
      </div>

      <ConstitutionForm constitution={constitution as BookConstitutionRow} />

      <section className="space-y-2">
        <h2 className="text-ink text-base font-semibold">
          Collision reports using this version
        </h2>
        {reports && reports.length ? (
          <ul className="divide-border border-border bg-surface divide-y rounded-lg border text-sm">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  href={`/cards/${r.card_id}/collision/${r.id}`}
                  className="text-lapis hover:underline"
                >
                  Report · {r.status}
                </Link>
                <span className="text-ink-faint text-xs">
                  {formatDate(r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted text-sm">
            No reports depend on this version yet.
          </p>
        )}
      </section>
    </div>
  );
}
