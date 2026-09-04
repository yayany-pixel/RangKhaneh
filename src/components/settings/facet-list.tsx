"use client";

import { useState } from "react";
import { FacetForm, type FacetFormValue } from "@/components/settings/facet-form";
import { deleteFacetAction } from "@/app/(app)/settings/actions";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Badge } from "@/components/ui/badge";
import { FACET_TYPES, labelOf } from "@/lib/constants/vocab";

export function FacetList({ facets }: { facets: FacetFormValue[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!facets.length) {
    return (
      <p className="text-ink-muted text-sm">
        No facets yet. Facets are a controlled vocabulary (colors, materials, places,
        periods…) you attach to cards.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {facets.map((f) => (
        <li key={f.id} className="border-border bg-surface rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="lapis">{labelOf(FACET_TYPES, f.facet_type)}</Badge>
            <span dir="auto" className="text-ink font-medium">
              {f.label_en || f.label_fa}
            </span>
            {f.label_en && f.label_fa ? (
              <span dir="auto" className="text-ink-muted text-sm">
                · {f.label_fa}
              </span>
            ) : null}
            {f.aliases.length ? (
              <span className="text-ink-faint text-xs">
                aliases: {f.aliases.join(", ")}
              </span>
            ) : null}
            <div className="ms-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId((id) => (id === f.id ? null : f.id))}
                className="text-ink-muted text-sm hover:underline"
              >
                {editingId === f.id ? "Close" : "Edit"}
              </button>
              <form action={deleteFacetAction}>
                <input type="hidden" name="facet_id" value={f.id} />
                <ConfirmSubmit
                  size="sm"
                  variant="ghost"
                  message="Delete this facet? It is removed from any cards it was attached to."
                  className="text-danger"
                >
                  Delete
                </ConfirmSubmit>
              </form>
            </div>
          </div>
          {editingId === f.id ? (
            <div className="mt-3">
              <FacetForm facet={f} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
