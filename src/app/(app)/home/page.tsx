import Link from "next/link";
import type { Metadata } from "next";
import {
  Inbox,
  FileWarning,
  BadgeCheck,
  CalendarClock,
  BookMarked,
  AlertTriangle,
} from "lucide-react";
import { getAuthedContext } from "@/lib/auth/session";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { CardListItem, CARD_LIST_COLUMNS } from "@/components/cards/card-list";
import type { CardSummary } from "@/lib/data/cards";

export const metadata: Metadata = { title: "Home — Rangkhaneh" };

export default async function HomePage() {
  const { supabase } = await getAuthedContext();

  const base = () =>
    supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

  const nowIso = new Date().toISOString();

  const [
    inboxRes,
    needsSourceRes,
    needsVerificationRes,
    reviewsDueRes,
    bookCandidatesRes,
    contradictionsRes,
  ] = await Promise.all([
    base().eq("workflow_status", "inbox"),
    base().is("source_id", null),
    base().eq("epistemic_status", "unreviewed"),
    base().not("next_review_at", "is", null).lte("next_review_at", nowIso),
    base().eq("workflow_status", "book_candidate"),
    base().eq("book_relation", "contradicts"),
  ]);

  const inboxCount = inboxRes.count ?? 0;
  const needsSource = needsSourceRes.count ?? 0;
  const needsVerification = needsVerificationRes.count ?? 0;
  const reviewsDue = reviewsDueRes.count ?? 0;
  const bookCandidates = bookCandidatesRes.count ?? 0;
  const contradictions = contradictionsRes.count ?? 0;

  const { data: recent } = await supabase
    .from("cards")
    .select(CARD_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(6);
  const recentCards = (recent ?? []) as unknown as CardSummary[];

  const { data: dormant } = await supabase
    .from("cards")
    .select(CARD_LIST_COLUMNS)
    .is("deleted_at", null)
    .eq("workflow_status", "dormant")
    .limit(3);
  const dormantCards = (dormant ?? []) as unknown as CardSummary[];

  const { data: currentConstitution } = await supabase
    .from("book_constitutions")
    .select("id,version_name,updated_at")
    .eq("is_current", true)
    .maybeSingle();

  const stats = [
    { label: "Inbox", value: inboxCount, href: "/inbox", icon: Inbox },
    {
      label: "Needs source",
      value: needsSource,
      href: "/archive?needs=source",
      icon: FileWarning,
    },
    {
      label: "Needs verification",
      value: needsVerification,
      href: "/archive?needs=verification",
      icon: BadgeCheck,
    },
    {
      label: "Reviews due",
      value: reviewsDue,
      href: "/archive?needs=review",
      icon: CalendarClock,
    },
    {
      label: "Book candidates",
      value: bookCandidates,
      href: "/archive?status=book_candidate",
      icon: BookMarked,
    },
    {
      label: "Contradictions",
      value: contradictions,
      href: "/archive?relation=contradicts",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-ink font-serif text-2xl font-semibold">The cabinet</h1>
          <p className="text-ink-muted mt-1 text-sm">
            A private archive and argument workshop for <em>Colors of Iran</em>.
          </p>
        </div>
        <Link
          href="/capture"
          className="bg-accent hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Quick capture
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="border-border bg-surface hover:border-border-strong rounded-lg border p-4"
            >
              <div className="text-ink-muted flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                <span className="text-sm">{s.label}</span>
              </div>
              <p className="text-ink mt-2 text-2xl font-semibold">{s.value}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <PanelHeader
              title="Recent cards"
              action={
                <Link href="/archive" className="text-lapis text-sm hover:underline">
                  Archive →
                </Link>
              }
            />
            <div className="space-y-3 p-4">
              {recentCards.length > 0 ? (
                recentCards.map((c) => <CardListItem key={c.id} card={c} />)
              ) : (
                <EmptyState
                  title="No cards yet"
                  description="Capture your first fragment — a quote, a color term, a photograph of a handwritten page."
                />
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Current constitution" />
            <div className="p-4 text-sm">
              {currentConstitution ? (
                <Link
                  href={`/book/constitution/${currentConstitution.id}`}
                  className="text-lapis hover:underline"
                >
                  {currentConstitution.version_name}
                </Link>
              ) : (
                <p className="text-ink-muted">
                  No current version.{" "}
                  <Link href="/book" className="text-lapis hover:underline">
                    Create one
                  </Link>
                  .
                </p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Rediscover"
              description="A few dormant cards worth revisiting."
            />
            <div className="space-y-3 p-4">
              {dormantCards.length > 0 ? (
                dormantCards.map((c) => <CardListItem key={c.id} card={c} />)
              ) : (
                <p className="text-ink-muted px-1 text-sm">
                  Nothing dormant right now.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
