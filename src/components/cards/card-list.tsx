import Link from "next/link";
import { Star } from "lucide-react";
import { CardBadges } from "./card-badges";
import { Highlight } from "@/components/ui/highlight";
import { preview, formatDate } from "@/lib/format";
import type { CardSummary } from "@/lib/data/cards";

export { CARD_LIST_COLUMNS } from "@/lib/data/cards";
export type { CardSummary } from "@/lib/data/cards";

export function CardListItem({
  card,
  terms = [],
}: {
  card: CardSummary;
  terms?: string[];
}) {
  const body = preview(card.original_content);
  return (
    <Link
      href={`/cards/${card.id}`}
      className="border-border bg-surface hover:border-border-strong block rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 dir="auto" className="text-ink min-w-0 font-serif text-lg font-medium">
          <Highlight text={card.title || "Untitled card"} terms={terms} />
        </h3>
        {card.is_favorite ? (
          <Star
            className="fill-saffron text-saffron h-4 w-4 shrink-0"
            aria-label="Pinned"
          />
        ) : null}
      </div>
      {body ? (
        <p dir="auto" className="text-ink-muted mt-1 line-clamp-2 text-sm">
          <Highlight text={body} terms={terms} />
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <CardBadges card={card} />
        <span className="text-ink-faint text-xs">{formatDate(card.captured_at)}</span>
      </div>
    </Link>
  );
}
