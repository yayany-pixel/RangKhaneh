import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Pencil, Trash2 } from "lucide-react";
import { getAuthedContext } from "@/lib/auth/session";
import { CardBadges } from "@/components/cards/card-badges";
import { AddTagForm } from "@/components/cards/detail/add-tag-form";
import { AttachmentManager } from "@/components/cards/attachment-manager";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  WORKFLOW_STATUSES,
  CARD_RELATION_TYPES,
  BOOK_RELATIONS,
  CALENDAR_SYSTEMS,
  DATE_PRECISIONS,
  RIGHTS_STATUSES,
  FACET_TYPES,
  COLLISION_VERDICTS,
  BOOK_NODE_TYPES,
  CARD_BOOK_USE_STATUSES,
  labelOf,
} from "@/lib/constants/vocab";
import {
  toggleFavoriteAction,
  setWorkflowStatusAction,
  softDeleteCardAction,
  removeTagAction,
  addFacetAction,
  removeFacetAction,
  addRelationAction,
  removeRelationAction,
  restoreRevisionAction,
} from "@/app/(app)/cards/actions";
import {
  linkCardToSectionAction,
  unlinkCardFromSectionAction,
} from "@/app/(app)/book/actions";

const TABS = [
  { key: "original", label: "Original" },
  { key: "workshop", label: "Working notes" },
  { key: "collision", label: "Collision" },
  { key: "connections", label: "Connections" },
  { key: "book", label: "Book use" },
  { key: "history", label: "History" },
] as const;

function ReadBlock({
  label,
  value,
  serif = false,
}: {
  label: string;
  value: string | null | undefined;
  serif?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="mb-4">
      <p className="text-ink-faint mb-1 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        dir="auto"
        className={`text-ink whitespace-pre-wrap ${serif ? "prose-reading" : "text-sm"}`}
      >
        {value}
      </p>
    </div>
  );
}

type SP = Record<string, string | string[] | undefined>;

export default async function CardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab =
    (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) &&
    TABS.some((t) => t.key === (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab))
      ? ((Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) as string)
      : "original";

  const { supabase, user } = await getAuthedContext();

  const { data: card } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!card) notFound();

  const source = card.source_id
    ? (
        await supabase
          .from("sources")
          .select("*")
          .eq("id", card.source_id)
          .maybeSingle()
      ).data
    : null;

  // Tags
  const { data: tagLinks } = await supabase
    .from("card_tags")
    .select("tag_id")
    .eq("card_id", id);
  const tagIds = (tagLinks ?? []).map((t) => t.tag_id);
  const { data: tags } = tagIds.length
    ? await supabase.from("tags").select("id,label").in("id", tagIds)
    : { data: [] as { id: string; label: string }[] };

  // Facets
  const { data: facetLinks } = await supabase
    .from("card_facets")
    .select("facet_id")
    .eq("card_id", id);
  const facetIds = (facetLinks ?? []).map((f) => f.facet_id);
  const { data: linkedFacets } = facetIds.length
    ? await supabase
        .from("facets")
        .select("id,label_en,label_fa,facet_type")
        .in("id", facetIds)
    : {
        data: [] as {
          id: string;
          label_en: string | null;
          label_fa: string | null;
          facet_type: string;
        }[],
      };
  const { data: allFacets } = await supabase
    .from("facets")
    .select("id,label_en,label_fa,facet_type")
    .order("facet_type", { ascending: true });
  const availableFacets = (allFacets ?? []).filter((f) => !facetIds.includes(f.id));

  // Relations
  const { data: relOut } = await supabase
    .from("card_relations")
    .select("id,to_card_id,relation_type,note")
    .eq("from_card_id", id);
  const { data: relIn } = await supabase
    .from("card_relations")
    .select("id,from_card_id,relation_type,note")
    .eq("to_card_id", id);
  const otherIds = Array.from(
    new Set([
      ...(relOut ?? []).map((r) => r.to_card_id),
      ...(relIn ?? []).map((r) => r.from_card_id),
    ]),
  );
  const { data: otherCards } = otherIds.length
    ? await supabase.from("cards").select("id,title").in("id", otherIds)
    : { data: [] as { id: string; title: string }[] };
  const titleOf = (cid: string) =>
    otherCards?.find((c) => c.id === cid)?.title ?? "Untitled";

  const { data: candidateCards } = await supabase
    .from("cards")
    .select("id,title")
    .is("deleted_at", null)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Book links
  const { data: bookLinks } = await supabase
    .from("card_book_links")
    .select("id,section_id,book_relation,intended_use,use_status")
    .eq("card_id", id);
  const sectionIds = (bookLinks ?? []).map((b) => b.section_id);
  const { data: sections } = sectionIds.length
    ? await supabase.from("book_sections").select("id,title").in("id", sectionIds)
    : { data: [] as { id: string; title: string }[] };

  // All sections (for the "link from card screen" picker).
  const { data: allSections } = await supabase
    .from("book_sections")
    .select("id,title,node_type")
    .eq("owner_id", user.id)
    .order("position", { ascending: true });
  const linkedSectionIds = new Set((bookLinks ?? []).map((b) => b.section_id));
  const linkableSections = (allSections ?? []).filter(
    (s) => !linkedSectionIds.has(s.id),
  );

  // Collision reports
  const { data: reports } = await supabase
    .from("collision_reports")
    .select("id,status,verdict,confidence,constitution_id,created_at,authorship")
    .eq("card_id", id)
    .order("created_at", { ascending: false });

  // Revisions
  const { data: revisions } = await supabase
    .from("card_revisions")
    .select("id,created_at,reason,snapshot")
    .eq("card_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Attachments
  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("card_id", id)
    .order("created_at", { ascending: true });

  const tabHref = (key: string) => `/cards/${id}?tab=${key}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 dir="auto" className="text-ink font-serif text-2xl font-semibold">
            {card.title || "Untitled card"}
          </h1>
          <div className="mt-2">
            <CardBadges card={card} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleFavoriteAction}>
            <input type="hidden" name="card_id" value={card.id} />
            <input type="hidden" name="value" value={(!card.is_favorite).toString()} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              aria-label={card.is_favorite ? "Unpin" : "Pin"}
            >
              <Star
                className={`h-4 w-4 ${card.is_favorite ? "fill-saffron text-saffron" : ""}`}
              />
            </Button>
          </form>
          <Link
            href={`/cards/${card.id}/edit`}
            className="border-border text-ink hover:bg-surface-2 inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <form action={softDeleteCardAction}>
            <input type="hidden" name="card_id" value={card.id} />
            <Button type="submit" variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" /> Trash
            </Button>
          </form>
        </div>
      </div>

      <nav className="border-border flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm ${
              tab === t.key
                ? "border-accent text-ink"
                : "text-ink-muted hover:text-ink border-transparent"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* ARCHIVE / ORIGINAL */}
      {tab === "original" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="border-border bg-surface rounded-lg border p-5 lg:col-span-2">
            <ReadBlock label="Original content" value={card.original_content} serif />
            <ReadBlock label="Exact quotation" value={card.exact_quote} serif />
            <ReadBlock label="Translation" value={card.translation} />
            <ReadBlock label="Transliteration" value={card.transliteration} />
            {!card.original_content &&
            !card.exact_quote &&
            !card.translation &&
            !card.transliteration ? (
              <p className="text-ink-muted text-sm">No original material recorded.</p>
            ) : null}
          </div>
          <aside className="space-y-4">
            <div className="border-border bg-surface rounded-lg border p-5 text-sm">
              <h3 className="text-ink mb-3 font-medium">Source & provenance</h3>
              {source ? (
                <p className="mb-2">
                  <Link href="/sources" className="text-lapis hover:underline">
                    {source.title}
                  </Link>
                </p>
              ) : (
                <p className="text-ink-muted mb-2">No source linked.</p>
              )}
              <Meta label="Locator" value={card.source_locator} />
              <Meta
                label="Rights"
                value={
                  labelOf(RIGHTS_STATUSES, card.rights_status) || card.rights_status
                }
              />
              <Meta label="Reliability" value={card.reliability_note} />
              <Meta label="Provenance" value={card.provenance_note} />
            </div>
            <div className="border-border bg-surface rounded-lg border p-5 text-sm">
              <h3 className="text-ink mb-3 font-medium">Dates</h3>
              <Meta label="Historical" value={card.historical_date_label} />
              <Meta
                label="Years"
                value={
                  card.historical_start_year || card.historical_end_year
                    ? `${card.historical_start_year ?? "?"} – ${card.historical_end_year ?? "?"}`
                    : null
                }
              />
              <Meta
                label="Precision"
                value={labelOf(DATE_PRECISIONS, card.date_precision)}
              />
              <Meta
                label="Calendar"
                value={labelOf(CALENDAR_SYSTEMS, card.calendar_system)}
              />
              <Meta label="Captured" value={formatDateTime(card.captured_at)} />
              {card.language_codes.length ? (
                <Meta label="Languages" value={card.language_codes.join(", ")} />
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {tab === "original" ? (
        <div className="border-border bg-surface rounded-lg border p-5">
          <h3 className="text-ink mb-3 font-medium">Attachments</h3>
          <AttachmentManager cardId={card.id} attachments={attachments ?? []} />
        </div>
      ) : null}

      {/* WORKSHOP */}
      {tab === "workshop" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="border-border bg-surface rounded-lg border p-5 lg:col-span-2">
            <ReadBlock label="Working content" value={card.working_content} />
            <ReadBlock label="Paraphrase" value={card.paraphrase} />
            <ReadBlock label="Summary" value={card.summary} />
            <ReadBlock label="Annotation" value={card.annotation} />
            <ReadBlock label="Questions raised" value={card.questions} />
            <ReadBlock label="Why this card matters" value={card.why_it_matters} />
            <div className="mt-2">
              <Link
                href={`/cards/${card.id}/edit`}
                className="text-lapis text-sm hover:underline"
              >
                Edit working notes →
              </Link>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="border-border bg-surface rounded-lg border p-5">
              <h3 className="text-ink mb-3 text-sm font-medium">Tags</h3>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(tags ?? []).length ? (
                  (tags ?? []).map((t) => (
                    <span
                      key={t.id}
                      className="border-border bg-surface-2 text-ink inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                    >
                      <span dir="auto">{t.label}</span>
                      <form action={removeTagAction} className="inline">
                        <input type="hidden" name="card_id" value={card.id} />
                        <input type="hidden" name="tag_id" value={t.id} />
                        <button
                          type="submit"
                          aria-label={`Remove ${t.label}`}
                          className="text-ink-faint hover:text-danger"
                        >
                          ×
                        </button>
                      </form>
                    </span>
                  ))
                ) : (
                  <p className="text-ink-muted text-xs">No tags yet.</p>
                )}
              </div>
              <AddTagForm cardId={card.id} />
            </div>

            <div className="border-border bg-surface rounded-lg border p-5">
              <h3 className="text-ink mb-3 text-sm font-medium">Facets</h3>
              <div className="mb-3 space-y-1.5">
                {(linkedFacets ?? []).length ? (
                  (linkedFacets ?? []).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span dir="auto">
                        <span className="text-ink-faint">
                          {labelOf(FACET_TYPES, f.facet_type) || f.facet_type}:{" "}
                        </span>
                        {f.label_en || f.label_fa}
                      </span>
                      <form action={removeFacetAction}>
                        <input type="hidden" name="card_id" value={card.id} />
                        <input type="hidden" name="facet_id" value={f.id} />
                        <button
                          type="submit"
                          aria-label="Remove facet"
                          className="text-ink-faint hover:text-danger"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  ))
                ) : (
                  <p className="text-ink-muted text-xs">No facets linked.</p>
                )}
              </div>
              {availableFacets.length ? (
                <form action={addFacetAction} className="flex items-center gap-2">
                  <input type="hidden" name="card_id" value={card.id} />
                  <Select name="facet_id" aria-label="Add facet" className="flex-1">
                    {availableFacets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {(f.label_en || f.label_fa) ?? ""}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" size="sm" variant="secondary">
                    Link
                  </Button>
                </form>
              ) : (
                <p className="text-ink-muted text-xs">
                  <Link href="/settings" className="text-lapis hover:underline">
                    Create facets
                  </Link>{" "}
                  to classify this card.
                </p>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {/* COLLISION */}
      {tab === "collision" ? (
        <div className="border-border bg-surface rounded-lg border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-ink font-medium">Collision reports</h3>
            <Link
              href={`/cards/${card.id}/collision/new`}
              className="bg-accent hover:bg-accent/90 rounded-md px-3 py-1.5 text-sm font-medium text-white"
            >
              Test against the book
            </Link>
          </div>
          {(reports ?? []).length ? (
            <ul className="divide-border divide-y">
              {(reports ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div className="text-sm">
                    <Link
                      href={`/cards/${card.id}/collision/${r.id}`}
                      className="text-lapis font-medium hover:underline"
                    >
                      {r.verdict
                        ? labelOf(COLLISION_VERDICTS, r.verdict) || r.verdict
                        : "Report"}{" "}
                      · {r.status}
                    </Link>
                    <p className="text-ink-faint text-xs">
                      {formatDate(r.created_at)}
                      {r.confidence != null ? ` · confidence ${r.confidence}` : ""}
                      {r.authorship !== "manual" ? ` · ${r.authorship}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted text-sm">
              No reports yet. A Collision Report compares this card against one version
              of the Book Constitution.
            </p>
          )}
        </div>
      ) : null}

      {/* CONNECTIONS */}
      {tab === "connections" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="border-border bg-surface rounded-lg border p-5">
            <h3 className="text-ink mb-3 font-medium">Relationships</h3>
            <ul className="mb-4 space-y-2 text-sm">
              {(relOut ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span dir="auto">
                    <span className="text-ink-faint">
                      {labelOf(CARD_RELATION_TYPES, r.relation_type)} →{" "}
                    </span>
                    <Link
                      href={`/cards/${r.to_card_id}`}
                      className="text-lapis hover:underline"
                    >
                      {titleOf(r.to_card_id)}
                    </Link>
                  </span>
                  <form action={removeRelationAction}>
                    <input type="hidden" name="relation_id" value={r.id} />
                    <input type="hidden" name="card_id" value={card.id} />
                    <button type="submit" className="text-ink-faint hover:text-danger">
                      ×
                    </button>
                  </form>
                </li>
              ))}
              {(relIn ?? []).map((r) => (
                <li key={r.id} dir="auto" className="text-ink-muted">
                  <Link
                    href={`/cards/${r.from_card_id}`}
                    className="text-lapis hover:underline"
                  >
                    {titleOf(r.from_card_id)}
                  </Link>{" "}
                  <span className="text-ink-faint">
                    {labelOf(CARD_RELATION_TYPES, r.relation_type)} → this card
                  </span>
                </li>
              ))}
              {!(relOut ?? []).length && !(relIn ?? []).length ? (
                <li className="text-ink-muted">No relationships yet.</li>
              ) : null}
            </ul>
          </div>
          <div className="border-border bg-surface rounded-lg border p-5">
            <h3 className="text-ink mb-3 font-medium">Add a relationship</h3>
            <form action={addRelationAction} className="space-y-3">
              <input type="hidden" name="from_card_id" value={card.id} />
              <Select
                name="relation_type"
                aria-label="Relation type"
                defaultValue="related"
              >
                {CARD_RELATION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.en}
                  </option>
                ))}
              </Select>
              <Select name="to_card_id" aria-label="Target card">
                {(candidateCards ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title || "Untitled"}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="secondary">
                Add relationship
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {/* BOOK USE */}
      {tab === "book" ? (
        <div className="border-border bg-surface rounded-lg border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-ink font-medium">Book placements</h3>
            <Link href="/book" className="text-lapis text-sm hover:underline">
              Open Book Map →
            </Link>
          </div>
          {(bookLinks ?? []).length ? (
            <ul className="divide-border divide-y text-sm">
              {(bookLinks ?? []).map((b) => (
                <li key={b.id} className="flex items-start justify-between py-3">
                  <div>
                    <p className="text-ink font-medium">
                      {sections?.find((s) => s.id === b.section_id)?.title ?? "Section"}
                    </p>
                    <p className="text-ink-faint text-xs">
                      {labelOf(BOOK_RELATIONS, b.book_relation)} · {b.use_status}
                      {b.intended_use ? ` · ${b.intended_use}` : ""}
                    </p>
                  </div>
                  <form action={unlinkCardFromSectionAction}>
                    <input type="hidden" name="link_id" value={b.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Unlink
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted text-sm">
              Not linked to any section. A card stays in the archive whether or not it
              is used in the book.
            </p>
          )}

          {linkableSections.length ? (
            <form
              action={linkCardToSectionAction}
              className="border-border mt-5 space-y-3 border-t pt-4"
            >
              <h4 className="text-ink text-sm font-medium">Link to a section</h4>
              <input type="hidden" name="card_id" value={card.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-ink-muted text-xs">
                  Section
                  <Select name="section_id" required className="mt-1">
                    {linkableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {labelOf(BOOK_NODE_TYPES, s.node_type)}: {s.title}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-ink-muted text-xs">
                  Relationship
                  <Select name="book_relation" defaultValue="supports" className="mt-1">
                    {BOOK_RELATIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.en}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-ink-muted text-xs">
                  Intended use
                  <input
                    name="intended_use"
                    placeholder="e.g. epigraph, example, counterexample"
                    className="border-border bg-surface text-ink mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-ink-muted text-xs">
                  Use status
                  <Select name="use_status" defaultValue="proposed" className="mt-1">
                    {CARD_BOOK_USE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.en}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <label className="text-ink-muted block text-xs">
                Rationale
                <textarea
                  name="rationale"
                  rows={2}
                  className="border-border bg-surface text-ink mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  dir="auto"
                />
              </label>
              <Button type="submit" variant="secondary" size="sm">
                Link to section
              </Button>
              <p className="text-ink-faint text-xs">
                Linking a card to the book never removes it from the archive.
              </p>
            </form>
          ) : (allSections ?? []).length === 0 ? (
            <p className="text-ink-faint mt-4 text-xs">
              No book sections yet.{" "}
              <Link href="/book" className="text-lapis hover:underline">
                Build the Book Map
              </Link>{" "}
              to start placing cards.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* HISTORY */}
      {tab === "history" ? (
        <div className="border-border bg-surface rounded-lg border p-5">
          <h3 className="text-ink mb-3 font-medium">Revision history</h3>
          {(revisions ?? []).length ? (
            <ul className="divide-border divide-y text-sm">
              {(revisions ?? []).map((rev) => {
                const snap = rev.snapshot as { title?: string } | null;
                return (
                  <li key={rev.id} className="flex items-center justify-between py-3">
                    <div>
                      <p dir="auto" className="text-ink">
                        {snap?.title || "Untitled"}
                      </p>
                      <p className="text-ink-faint text-xs">
                        {formatDateTime(rev.created_at)} · {rev.reason ?? "auto"}
                      </p>
                    </div>
                    <form action={restoreRevisionAction}>
                      <input type="hidden" name="revision_id" value={rev.id} />
                      <input type="hidden" name="card_id" value={card.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Restore
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-ink-muted text-sm">
              No revisions yet. Snapshots are captured automatically when key content
              changes.
            </p>
          )}
        </div>
      ) : null}

      {/* Workflow status control (always visible footer) */}
      <div className="border-border bg-surface rounded-lg border p-4">
        <form
          action={setWorkflowStatusAction}
          className="flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="card_id" value={card.id} />
          <label htmlFor="workflow_status" className="text-ink-muted text-sm">
            Workflow status
          </label>
          <Select
            id="workflow_status"
            name="workflow_status"
            defaultValue={card.workflow_status}
            className="w-auto"
          >
            {WORKFLOW_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="secondary">
            Update
          </Button>
        </form>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <p className="mb-1.5">
      <span className="text-ink-faint">{label}: </span>
      <span dir="auto" className="text-ink">
        {value}
      </span>
    </p>
  );
}
