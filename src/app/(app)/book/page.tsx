import type { Metadata } from "next";
import Link from "next/link";
import { getAuthedContext } from "@/lib/auth/session";
import { BookMap, type SectionLink } from "@/components/book/book-map";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/panel";
import { formatDate } from "@/lib/format";
import {
  setCurrentConstitutionAction,
  duplicateConstitutionAction,
} from "@/app/(app)/book/actions";

export const metadata: Metadata = { title: "Book — Rangkhaneh" };

export default async function BookPage() {
  const { supabase } = await getAuthedContext();

  const [
    { data: constitutions },
    { data: sections },
    { data: links },
    { data: cards },
  ] = await Promise.all([
    supabase
      .from("book_constitutions")
      .select("id,version_name,is_current,revision_note,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("book_sections")
      .select("id,parent_id,node_type,title,position")
      .order("position", { ascending: true }),
    supabase
      .from("card_book_links")
      .select("id,card_id,section_id,book_relation,use_status"),
    supabase
      .from("cards")
      .select("id,title")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const cardTitle = new Map((cards ?? []).map((c) => [c.id, c.title]));
  const linksBySection: Record<string, SectionLink[]> = {};
  for (const l of links ?? []) {
    (linksBySection[l.section_id] ??= []).push({
      id: l.id,
      card_id: l.card_id,
      title: cardTitle.get(l.card_id) ?? "Untitled",
      book_relation: l.book_relation,
      use_status: l.use_status,
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-ink font-serif text-2xl font-semibold">Book</h1>
          <p className="text-ink-muted mt-1 text-sm">
            The Book Constitution is the project&rsquo;s current state; the Book Map is
            its evolving outline. A card stays in the archive whether or not it is used
            here.
          </p>
        </div>
        <Link
          href="/book/constitution/new"
          className="bg-accent hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          New constitution version
        </Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-ink text-base font-semibold">Book Constitution versions</h2>
        {constitutions && constitutions.length ? (
          <div className="divide-border border-border bg-surface divide-y rounded-lg border">
            {constitutions.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/book/constitution/${c.id}`}
                    dir="auto"
                    className="text-ink font-serif text-lg font-medium hover:underline"
                  >
                    {c.version_name}
                  </Link>
                  {c.is_current ? (
                    <Badge tone="verdigris" className="ms-2">
                      Current
                    </Badge>
                  ) : null}
                  <p className="text-ink-faint text-xs">
                    {formatDate(c.created_at)}
                    {c.revision_note ? ` · ${c.revision_note}` : ""}
                  </p>
                </div>
                {!c.is_current ? (
                  <form action={setCurrentConstitutionAction}>
                    <input type="hidden" name="constitution_id" value={c.id} />
                    <button
                      type="submit"
                      className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
                    >
                      Make current
                    </button>
                  </form>
                ) : null}
                <form action={duplicateConstitutionAction}>
                  <input type="hidden" name="constitution_id" value={c.id} />
                  <button
                    type="submit"
                    className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
                  >
                    Duplicate
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No constitution versions yet"
            description="Create the first one to anchor your Collision Reports."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-ink text-base font-semibold">Book Map</h2>
        <BookMap
          sections={sections ?? []}
          linksBySection={linksBySection}
          cards={cards ?? []}
        />
      </section>
    </div>
  );
}
