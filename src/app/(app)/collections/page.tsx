import type { Metadata } from "next";
import Link from "next/link";
import { getAuthedContext } from "@/lib/auth/session";
import { CreateCollectionForm } from "@/components/collections/create-form";

export const metadata: Metadata = { title: "Collections — Rangkhaneh" };

export default async function CollectionsPage() {
  const { supabase } = await getAuthedContext();
  const { data: collections } = await supabase
    .from("collections")
    .select("id,title,description,is_archived")
    .order("created_at", { ascending: false });

  const active = (collections ?? []).filter((c) => !c.is_archived);
  const archived = (collections ?? []).filter((c) => c.is_archived);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-ink font-serif text-2xl font-semibold">Collections</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Curated, manually ordered sets of cards — writing packets and dossiers.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {active.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {active.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}`}
                  className="border-border bg-surface hover:border-border-strong rounded-lg border p-4"
                >
                  <p dir="auto" className="text-ink font-serif text-lg font-medium">
                    {c.title}
                  </p>
                  {c.description ? (
                    <p dir="auto" className="text-ink-muted mt-1 line-clamp-2 text-sm">
                      {c.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted text-sm">No collections yet.</p>
          )}

          {archived.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-ink-muted mb-3 text-sm font-medium">Archived</h2>
              <ul className="space-y-1">
                {archived.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/collections/${c.id}`}
                      dir="auto"
                      className="text-ink-muted text-sm hover:underline"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="text-ink-muted mb-3 text-sm font-medium">New collection</h2>
          <CreateCollectionForm />
        </div>
      </div>
    </div>
  );
}
