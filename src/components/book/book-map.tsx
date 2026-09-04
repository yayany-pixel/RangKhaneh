"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
  moveSectionAction,
  linkCardToSectionAction,
  unlinkCardFromSectionAction,
} from "@/app/(app)/book/actions";
import type { ActionResult } from "@/lib/actions/util";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  BOOK_NODE_TYPES,
  BOOK_RELATIONS,
  CARD_BOOK_USE_STATUSES,
  labelOf,
} from "@/lib/constants/vocab";

export type SectionNode = {
  id: string;
  parent_id: string | null;
  node_type: string;
  title: string;
  position: number;
};

export type SectionLink = {
  id: string;
  card_id: string;
  title: string;
  book_relation: string;
  use_status: string;
};

type Props = {
  sections: SectionNode[];
  linksBySection: Record<string, SectionLink[]>;
  cards: { id: string; title: string }[];
};

function AddSectionForm({
  parentId,
  onDone,
}: {
  parentId: string | null;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createSectionAction,
    null,
  );
  if (state?.ok && onDone) onDone();
  return (
    <form
      action={formAction}
      className="border-border bg-surface-2 mt-2 flex flex-wrap items-center gap-2 rounded-md border p-2"
    >
      {parentId ? <input type="hidden" name="parent_id" value={parentId} /> : null}
      <Select
        name="node_type"
        aria-label="Node type"
        defaultValue={parentId ? "section" : "chapter"}
        className="w-32"
      >
        {BOOK_NODE_TYPES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.en}
          </option>
        ))}
      </Select>
      <Input name="title" dir="auto" placeholder="Title" className="flex-1" />
      <Button type="submit" size="sm" variant="secondary">
        Add
      </Button>
    </form>
  );
}

function RenameForm({ section, onDone }: { section: SectionNode; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateSectionAction,
    null,
  );
  if (state?.ok) onDone();
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="section_id" value={section.id} />
      <input type="hidden" name="node_type" value={section.node_type} />
      {section.parent_id ? (
        <input type="hidden" name="parent_id" value={section.parent_id} />
      ) : null}
      <Input name="title" dir="auto" defaultValue={section.title} className="flex-1" />
      <Button type="submit" size="sm" variant="secondary">
        Save
      </Button>
      <button
        type="button"
        onClick={onDone}
        className="text-ink-muted text-sm hover:underline"
      >
        Cancel
      </button>
    </form>
  );
}

function LinkedCards({
  sectionId,
  links,
  cards,
}: {
  sectionId: string;
  links: SectionLink[];
  cards: { id: string; title: string }[];
}) {
  const linkedIds = new Set(links.map((l) => l.card_id));
  const available = cards.filter((c) => !linkedIds.has(c.id));
  return (
    <div className="border-border mt-2 space-y-2 border-t pt-2">
      {links.length ? (
        <ul className="space-y-1 text-sm">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2">
              <span dir="auto" className="min-w-0 truncate">
                <Link
                  href={`/cards/${l.card_id}`}
                  className="text-lapis hover:underline"
                >
                  {l.title || "Untitled"}
                </Link>{" "}
                <span className="text-ink-faint">
                  · {labelOf(BOOK_RELATIONS, l.book_relation)} · {l.use_status}
                </span>
              </span>
              <form action={unlinkCardFromSectionAction}>
                <input type="hidden" name="link_id" value={l.id} />
                <button
                  type="submit"
                  aria-label="Unlink card"
                  className="text-ink-faint hover:text-danger"
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-faint text-xs">No cards linked here yet.</p>
      )}
      {available.length ? (
        <form
          action={linkCardToSectionAction}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="section_id" value={sectionId} />
          <Select name="card_id" aria-label="Card to link" className="min-w-40 flex-1">
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || "Untitled"}
              </option>
            ))}
          </Select>
          <Select
            name="book_relation"
            aria-label="Relation"
            defaultValue="untested"
            className="w-36"
          >
            {BOOK_RELATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Select
            name="use_status"
            aria-label="Use status"
            defaultValue="proposed"
            className="w-32"
          >
            {CARD_BOOK_USE_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.en}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Link
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function Node({
  section,
  depth,
  childrenOf,
  linksBySection,
  cards,
}: {
  section: SectionNode;
  depth: number;
  childrenOf: (id: string | null) => SectionNode[];
  linksBySection: Record<string, SectionLink[]>;
  cards: { id: string; title: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const children = childrenOf(section.id);
  const links = linksBySection[section.id] ?? [];

  return (
    <li>
      <div
        className="border-border bg-surface rounded-lg border p-3"
        style={{ marginInlineStart: depth * 20 }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{labelOf(BOOK_NODE_TYPES, section.node_type)}</Badge>
          {editing ? (
            <RenameForm section={section} onDone={() => setEditing(false)} />
          ) : (
            <span dir="auto" className="text-ink font-serif text-base font-medium">
              {section.title}
            </span>
          )}
          <div className="ms-auto flex items-center gap-1">
            <form action={moveSectionAction}>
              <input type="hidden" name="section_id" value={section.id} />
              <input type="hidden" name="direction" value="up" />
              {section.parent_id ? (
                <input type="hidden" name="parent_id" value={section.parent_id} />
              ) : null}
              <button
                type="submit"
                aria-label="Move up"
                className="text-ink-faint hover:text-ink px-1"
              >
                ↑
              </button>
            </form>
            <form action={moveSectionAction}>
              <input type="hidden" name="section_id" value={section.id} />
              <input type="hidden" name="direction" value="down" />
              {section.parent_id ? (
                <input type="hidden" name="parent_id" value={section.parent_id} />
              ) : null}
              <button
                type="submit"
                aria-label="Move down"
                className="text-ink-faint hover:text-ink px-1"
              >
                ↓
              </button>
            </form>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="text-ink-muted px-1 text-xs hover:underline"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => setAdding((a) => !a)}
              className="text-ink-muted px-1 text-xs hover:underline"
            >
              + Child
            </button>
            <button
              type="button"
              onClick={() => setShowCards((s) => !s)}
              className="text-ink-muted px-1 text-xs hover:underline"
            >
              Cards ({links.length})
            </button>
            <form action={deleteSectionAction}>
              <input type="hidden" name="section_id" value={section.id} />
              <ConfirmSubmit
                size="sm"
                variant="ghost"
                message="Delete this section and its children? Card links here are removed; the cards remain in the archive."
                className="text-danger"
              >
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        </div>

        {showCards ? (
          <LinkedCards sectionId={section.id} links={links} cards={cards} />
        ) : null}
        {adding ? (
          <AddSectionForm parentId={section.id} onDone={() => setAdding(false)} />
        ) : null}
      </div>

      {children.length ? (
        <ul className="mt-2 space-y-2">
          {children.map((child) => (
            <Node
              key={child.id}
              section={child}
              depth={depth + 1}
              childrenOf={childrenOf}
              linksBySection={linksBySection}
              cards={cards}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function BookMap({ sections, linksBySection, cards }: Props) {
  const childrenOf = (id: string | null) =>
    sections.filter((s) => s.parent_id === id).sort((a, b) => a.position - b.position);
  const roots = childrenOf(null);

  return (
    <div className="space-y-3">
      {roots.length ? (
        <ul className="space-y-2">
          {roots.map((s) => (
            <Node
              key={s.id}
              section={s}
              depth={0}
              childrenOf={childrenOf}
              linksBySection={linksBySection}
              cards={cards}
            />
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted text-sm">
          No outline yet. Add a top-level node to begin.
        </p>
      )}
      <div>
        <p className="text-ink mb-1 text-sm font-medium">Add top-level node</p>
        <AddSectionForm parentId={null} />
      </div>
    </div>
  );
}
