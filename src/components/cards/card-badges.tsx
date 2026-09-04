import { Badge } from "@/components/ui/badge";
import {
  CARD_DOMAINS,
  CARD_TYPES,
  WORKFLOW_STATUSES,
  EPISTEMIC_STATUSES,
  BOOK_RELATIONS,
  labelOf,
} from "@/lib/constants/vocab";
import type { CardRow } from "@/lib/supabase/database.types";

const domainTone: Record<
  string,
  "lapis" | "madder" | "verdigris" | "saffron" | "neutral"
> = {
  research: "lapis",
  creative: "madder",
  personal: "verdigris",
  manuscript: "saffron",
};

export function DomainBadge({ value }: { value: string }) {
  const tone = domainTone[value] ?? "neutral";
  return <Badge tone={tone}>{labelOf(CARD_DOMAINS, value)}</Badge>;
}

export function TypeBadge({ value }: { value: string }) {
  return <Badge tone="neutral">{labelOf(CARD_TYPES, value)}</Badge>;
}

export function WorkflowBadge({ value }: { value: string }) {
  return <Badge tone="turquoise">{labelOf(WORKFLOW_STATUSES, value)}</Badge>;
}

export function EpistemicBadge({ value }: { value: string }) {
  const tone =
    value === "verified"
      ? "verdigris"
      : value === "disputed" || value === "speculative"
        ? "madder"
        : "neutral";
  return <Badge tone={tone}>{labelOf(EPISTEMIC_STATUSES, value)}</Badge>;
}

export function BookRelationBadge({ value }: { value: string }) {
  if (value === "untested") return null;
  return <Badge tone="saffron">{labelOf(BOOK_RELATIONS, value)}</Badge>;
}

export function CardBadges({
  card,
}: {
  card: Pick<
    CardRow,
    "domain" | "card_type" | "workflow_status" | "epistemic_status" | "book_relation"
  >;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DomainBadge value={card.domain} />
      <TypeBadge value={card.card_type} />
      <WorkflowBadge value={card.workflow_status} />
      {card.epistemic_status !== "not_applicable" ? (
        <EpistemicBadge value={card.epistemic_status} />
      ) : null}
      <BookRelationBadge value={card.book_relation} />
    </div>
  );
}
