import type { Metadata } from "next";
import Link from "next/link";
import { getAuthedContext } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/panel";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { deleteSourceAction } from "@/app/(app)/sources/actions";
import { labelOf, SOURCE_TYPES } from "@/lib/constants/vocab";

export const metadata: Metadata = { title: "Sources — Rangkhaneh" };

export default async function SourcesPage() {
  const { supabase } = await getAuthedContext();
  const { data: sources } = await supabase
    .from("sources")
    .select("id,title,source_type,author,url")
    .order("title", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-ink font-serif text-2xl font-semibold">Sources</h1>
          <p className="text-ink-muted mt-1 text-sm">
            Provenance records linked from cards.
          </p>
        </div>
        <Link
          href="/sources/new"
          className="bg-accent hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          New source
        </Link>
      </header>

      {sources && sources.length > 0 ? (
        <div className="divide-border border-border bg-surface divide-y rounded-lg border">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p dir="auto" className="text-ink font-medium">
                  {s.title}
                </p>
                <p className="text-ink-faint text-xs">
                  {labelOf(SOURCE_TYPES, s.source_type)}
                  {s.author ? ` · ${s.author}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lapis text-sm hover:underline"
                  >
                    Link
                  </a>
                ) : null}
                <Link
                  href={`/sources/${s.id}/edit`}
                  className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
                <form action={deleteSourceAction}>
                  <input type="hidden" name="source_id" value={s.id} />
                  <ConfirmSubmit
                    size="sm"
                    variant="ghost"
                    message="Delete this source? Cards keep their content but lose the link."
                  >
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No sources yet"
          description="Add a book, manuscript, website, or archive as a provenance record."
        />
      )}
    </div>
  );
}
