import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { getAuthedContext } from "@/lib/auth/session";
import { CardBadges } from "@/components/cards/card-badges";
import { CollectionSettings } from "@/components/collections/settings";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { preview } from "@/lib/format";
import { CARD_LIST_COLUMNS, type CardSummary } from "@/lib/data/cards";
import {
  addCardToCollectionAction,
  removeCardFromCollectionAction,
  moveCollectionCardAction,
} from "@/app/(app)/collections/actions";

export const metadata: Metadata = { title: "Collection — Rangkhaneh" };

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAuthedContext();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!collection) notFound();

  const { data: items } = await supabase
    .from("collection_cards")
    .select("card_id,position,note")
    .eq("collection_id", id)
    .order("position", { ascending: true });

  const orderedIds = (items ?? []).map((i) => i.card_id);
  const { data: cardRows } = orderedIds.length
    ? await supabase.from("cards").select(CARD_LIST_COLUMNS).in("id", orderedIds)
    : { data: [] as unknown as CardSummary[] };
  const cardsById = new Map(
    ((cardRows ?? []) as unknown as CardSummary[]).map((c) => [c.id, c]),
  );
  const orderedCards = orderedIds
    .map((cid) => cardsById.get(cid))
    .filter((c): c is CardSummary => Boolean(c));

  const { data: candidates } = await supabase
    .from("cards")
    .select("id,title")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const available = (candidates ?? []).filter((c) => !orderedIds.includes(c.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 dir="auto" className="text-ink font-serif text-2xl font-semibold">
            {collection.title}
          </h1>
          {collection.description ? (
            <p dir="auto" className="text-ink-muted mt-1 text-sm">
              {collection.description}
            </p>
          ) : null}
          <p className="text-ink-faint mt-1 text-xs">
            {orderedCards.length} card{orderedCards.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/collections/${id}/export?format=markdown`}
            className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
          >
            Export .md
          </a>
          <a
            href={`/collections/${id}/export?format=json`}
            className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
          >
            Export .json
          </a>
        </div>
      </header>

      <CollectionSettings
        id={collection.id}
        title={collection.title}
        description={collection.description}
        isArchived={collection.is_archived}
      />

      <div className="border-border bg-surface rounded-lg border p-4">
        <h2 className="text-ink mb-3 text-sm font-medium">Add a card</h2>
        {available.length ? (
          <form action={addCardToCollectionAction} className="flex items-center gap-2">
            <input type="hidden" name="collection_id" value={id} />
            <Select name="card_id" aria-label="Card to add" className="flex-1">
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || "Untitled"}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="secondary">
              Add
            </Button>
          </form>
        ) : (
          <p className="text-ink-muted text-sm">No more cards to add.</p>
        )}
      </div>

      {orderedCards.length ? (
        <ol className="space-y-3">
          {orderedCards.map((c, index) => (
            <li
              key={c.id}
              className="border-border bg-surface flex items-start gap-3 rounded-lg border p-4"
            >
              <div className="flex flex-col gap-1 pt-1">
                <form action={moveCollectionCardAction}>
                  <input type="hidden" name="collection_id" value={id} />
                  <input type="hidden" name="card_id" value={c.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    aria-label="Move up"
                    disabled={index === 0}
                    className="text-ink-faint hover:text-ink disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </form>
                <form action={moveCollectionCardAction}>
                  <input type="hidden" name="collection_id" value={id} />
                  <input type="hidden" name="card_id" value={c.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    aria-label="Move down"
                    disabled={index === orderedCards.length - 1}
                    className="text-ink-faint hover:text-ink disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </form>
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/cards/${c.id}`}
                  dir="auto"
                  className="text-ink font-serif text-lg font-medium hover:underline"
                >
                  {c.title || "Untitled card"}
                </Link>
                <p dir="auto" className="text-ink-muted mt-1 line-clamp-2 text-sm">
                  {preview(c.original_content)}
                </p>
                <div className="mt-2">
                  <CardBadges card={c} />
                </div>
              </div>
              <form action={removeCardFromCollectionAction}>
                <input type="hidden" name="collection_id" value={id} />
                <input type="hidden" name="card_id" value={c.id} />
                <button
                  type="submit"
                  aria-label="Remove from collection"
                  className="text-ink-faint hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-ink-muted text-sm">
          This collection is empty. Add cards above.
        </p>
      )}
    </div>
  );
}
