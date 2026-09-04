import type { Metadata } from "next";
import Link from "next/link";
import { getAuthedContext } from "@/lib/auth/session";
import { queryCards, type CardFilters } from "@/lib/data/cards";
import { CardListItem } from "@/components/cards/card-list";
import { EmptyState } from "@/components/ui/panel";
import { Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CARD_DOMAINS,
  CARD_TYPES,
  WORKFLOW_STATUSES,
  EPISTEMIC_STATUSES,
  BOOK_RELATIONS,
} from "@/lib/constants/vocab";

export const metadata: Metadata = { title: "Archive — Rangkhaneh" };

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function AllOption({ label }: { label: string }) {
  return <option value="">{label}</option>;
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { supabase } = await getAuthedContext();

  const filters: CardFilters = {
    q: one(sp, "q"),
    domain: one(sp, "domain"),
    card_type: one(sp, "type"),
    status: one(sp, "status"),
    epistemic: one(sp, "epistemic"),
    relation: one(sp, "relation"),
    source: one(sp, "source"),
    tag: one(sp, "tag"),
    facet: one(sp, "facet"),
    collection: one(sp, "collection"),
    section: one(sp, "section"),
    needs: one(sp, "needs"),
    favorite: one(sp, "favorite") === "1",
    hasAttachment: one(sp, "attachment") === "1",
    sort: one(sp, "sort"),
  };

  const { cards, terms, count } = await queryCards(supabase, filters);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-ink font-serif text-2xl font-semibold">Archive</h1>
          <p className="text-ink-muted mt-1 text-sm">
            {count} card{count === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/cards/new"
          className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-2 text-sm"
        >
          New card
        </Link>
      </header>

      <form
        method="get"
        action="/archive"
        className="border-border bg-surface rounded-lg border p-4"
      >
        <div className="mb-3">
          <Input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search titles, content, translations, sources… (Persian or English)"
            dir="auto"
            aria-label="Search query"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select name="domain" defaultValue={filters.domain ?? ""} aria-label="Domain">
            <AllOption label="Any domain" />
            {CARD_DOMAINS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Select name="type" defaultValue={filters.card_type ?? ""} aria-label="Type">
            <AllOption label="Any type" />
            {CARD_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={filters.status ?? ""} aria-label="Status">
            <AllOption label="Any status" />
            {WORKFLOW_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Select
            name="epistemic"
            defaultValue={filters.epistemic ?? ""}
            aria-label="Epistemic status"
          >
            <AllOption label="Any epistemic" />
            {EPISTEMIC_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Select
            name="relation"
            defaultValue={filters.relation ?? ""}
            aria-label="Book relation"
          >
            <AllOption label="Any relation" />
            {BOOK_RELATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={filters.sort ?? "recent"} aria-label="Sort">
            <option value="recent">Newest</option>
            <option value="captured">Captured</option>
            <option value="updated">Updated</option>
            <option value="title">Title</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="text-ink-muted flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="favorite"
              value="1"
              defaultChecked={filters.favorite}
            />
            Pinned only
          </label>
          <label className="text-ink-muted flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="attachment"
              value="1"
              defaultChecked={filters.hasAttachment}
            />
            Has attachment
          </label>
          <Select name="needs" defaultValue={filters.needs ?? ""} aria-label="Needs">
            <AllOption label="No follow-up filter" />
            <option value="source">Needs source</option>
            <option value="verification">Needs verification</option>
            <option value="review">Review due</option>
          </Select>
          <div className="ml-auto flex gap-2">
            <Link
              href="/archive"
              className="text-ink-muted hover:bg-surface-2 rounded-md px-3 py-2 text-sm"
            >
              Reset
            </Link>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </div>
      </form>

      {cards.length > 0 ? (
        <div className="space-y-3">
          {cards.map((c) => (
            <CardListItem key={c.id} card={c} terms={terms} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No cards match"
          description="Try a different spelling, remove a filter, or capture something new."
        />
      )}
    </div>
  );
}
