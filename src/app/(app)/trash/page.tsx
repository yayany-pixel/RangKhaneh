import type { Metadata } from "next";
import Link from "next/link";
import { getAuthedContext } from "@/lib/auth/session";
import { Panel, EmptyState } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { CardBadges } from "@/components/cards/card-badges";
import { restoreCardAction, purgeCardAction } from "@/app/(app)/cards/actions";
import { CARD_LIST_COLUMNS, type CardSummary } from "@/lib/data/cards";
import { preview } from "@/lib/format";

export const metadata: Metadata = { title: "Trash — Rangkhaneh" };

export default async function TrashPage() {
  const { supabase } = await getAuthedContext();
  const { data } = await supabase
    .from("cards")
    .select(CARD_LIST_COLUMNS)
    .not("deleted_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  const cards = (data ?? []) as unknown as CardSummary[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-ink font-serif text-2xl font-semibold">Trash</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Soft-deleted cards. Restore them, or delete permanently.
        </p>
      </header>

      {cards.length === 0 ? (
        <Panel>
          <EmptyState title="Trash is empty" description="Nothing has been deleted." />
        </Panel>
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <div key={c.id} className="border-border bg-surface rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/cards/${c.id}`}
                    dir="auto"
                    className="text-ink font-serif text-lg font-medium hover:underline"
                  >
                    {c.title || "Untitled card"}
                  </Link>
                  <p dir="auto" className="text-ink-muted mt-1 line-clamp-1 text-sm">
                    {preview(c.original_content)}
                  </p>
                  <div className="mt-2">
                    <CardBadges card={c} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={restoreCardAction}>
                    <input type="hidden" name="card_id" value={c.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      Restore
                    </Button>
                  </form>
                  <form action={purgeCardAction}>
                    <input type="hidden" name="card_id" value={c.id} />
                    <ConfirmSubmit
                      size="sm"
                      variant="danger"
                      message="Delete this card permanently? This cannot be undone."
                    >
                      Delete forever
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
