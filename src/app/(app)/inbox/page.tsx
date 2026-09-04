import Link from "next/link";
import type { Metadata } from "next";
import { Check, Circle } from "lucide-react";
import { getAuthedContext } from "@/lib/auth/session";
import { CardListItem } from "@/components/cards/card-list";
import { CARD_LIST_COLUMNS, type CardSummary } from "@/lib/data/cards";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { CardBadges } from "@/components/cards/card-badges";
import { setWorkflowStatusAction } from "@/app/(app)/cards/actions";
import { WORKFLOW_STATUSES } from "@/lib/constants/vocab";
import { preview } from "@/lib/format";

export const metadata: Metadata = { title: "Inbox — Rangkhaneh" };

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {done ? (
        <Check className="text-verdigris h-4 w-4" aria-hidden />
      ) : (
        <Circle className="text-ink-faint h-4 w-4" aria-hidden />
      )}
      <span className={done ? "text-ink" : "text-ink-muted"}>{label}</span>
    </li>
  );
}

export default async function InboxPage() {
  const { supabase } = await getAuthedContext();

  const { data: queueData, count } = await supabase
    .from("cards")
    .select(CARD_LIST_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .eq("workflow_status", "inbox")
    .order("captured_at", { ascending: true })
    .limit(50);
  const queue = (queueData ?? []) as unknown as CardSummary[];

  if (queue.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-ink font-serif text-2xl font-semibold">Inbox</h1>
        <Panel>
          <EmptyState
            title="Inbox zero"
            description="Everything captured has been processed. Capture something new to keep the archive growing."
            action={
              <Link
                href="/capture"
                className="bg-accent hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-medium text-white"
              >
                Quick capture
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  const current = queue[0];
  const [
    { data: full },
    { count: tagCount },
    { count: facetCount },
    { count: reportCount },
  ] = await Promise.all([
    supabase
      .from("cards")
      .select(
        "id,source_id,exact_quote,paraphrase,translation,transliteration,working_content",
      )
      .eq("id", current.id)
      .single(),
    supabase
      .from("card_tags")
      .select("*", { count: "exact", head: true })
      .eq("card_id", current.id),
    supabase
      .from("card_facets")
      .select("*", { count: "exact", head: true })
      .eq("card_id", current.id),
    supabase
      .from("collision_reports")
      .select("*", { count: "exact", head: true })
      .eq("card_id", current.id),
  ]);

  const checks = [
    { label: "Source identified", done: Boolean(full?.source_id) },
    {
      label: "Quotation separated from paraphrase",
      done: Boolean(full?.exact_quote || full?.paraphrase),
    },
    {
      label: "Translation or transcription added",
      done: Boolean(
        full?.translation || full?.transliteration || full?.working_content,
      ),
    },
    { label: "Tags added", done: (tagCount ?? 0) > 0 },
    { label: "Facets added", done: (facetCount ?? 0) > 0 },
    { label: "Collision test run", done: (reportCount ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-ink font-serif text-2xl font-semibold">Inbox</h1>
          <p className="text-ink-muted mt-1 text-sm">
            {count} card{count === 1 ? "" : "s"} to process · one at a time
          </p>
        </div>
      </header>

      <Panel>
        <PanelHeader
          title="Now processing"
          action={
            <Link
              href={`/cards/${current.id}`}
              className="text-lapis text-sm hover:underline"
            >
              Open full card →
            </Link>
          }
        />
        <div className="grid gap-5 p-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 dir="auto" className="text-ink font-serif text-xl font-medium">
              {current.title || "Untitled card"}
            </h2>
            <div className="mt-2">
              <CardBadges card={current} />
            </div>
            <p dir="auto" className="text-ink-muted mt-3 text-sm whitespace-pre-wrap">
              {preview(current.original_content, 500)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/cards/${current.id}`}
                className="bg-accent hover:bg-accent/90 rounded-md px-3 py-1.5 text-sm font-medium text-white"
              >
                Process
              </Link>
              <form
                action={setWorkflowStatusAction}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="card_id" value={current.id} />
                <Select
                  name="workflow_status"
                  defaultValue="processed"
                  className="w-auto"
                >
                  {WORKFLOW_STATUSES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.en}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="secondary">
                  Set status
                </Button>
              </form>
            </div>
          </div>
          <aside className="border-border bg-paper rounded-lg border p-4">
            <h3 className="text-ink mb-3 text-sm font-medium">Processing checklist</h3>
            <ul className="space-y-2">
              {checks.map((c) => (
                <ChecklistItem key={c.label} done={c.done} label={c.label} />
              ))}
            </ul>
          </aside>
        </div>
      </Panel>

      {queue.length > 1 ? (
        <section>
          <h2 className="text-ink-muted mb-3 text-sm font-medium">Next in the queue</h2>
          <div className="space-y-3">
            {queue.slice(1).map((c) => (
              <CardListItem key={c.id} card={c} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
