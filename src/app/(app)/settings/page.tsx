import type { Metadata } from "next";
import { getAuthedContext } from "@/lib/auth/session";
import { FacetForm, type FacetFormValue } from "@/components/settings/facet-form";
import { FacetList } from "@/components/settings/facet-list";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { formatDateTime } from "@/lib/format";
import { deleteTagAction, setAiEnabledAction } from "@/app/(app)/settings/actions";

export const metadata: Metadata = { title: "Settings — Rangkhaneh" };

export default async function SettingsPage() {
  const { supabase } = await getAuthedContext();

  const [{ data: facets }, { data: aliases }, { data: tags }, { data: settings }] =
    await Promise.all([
      supabase
        .from("facets")
        .select("id,facet_type,label_en,label_fa,description")
        .order("facet_type", { ascending: true }),
      supabase.from("facet_aliases").select("facet_id,alias"),
      supabase.from("tags").select("id,label").order("label", { ascending: true }),
      supabase.from("user_settings").select("ai_enabled,last_export_at").maybeSingle(),
    ]);

  const aliasesByFacet = new Map<string, string[]>();
  for (const a of aliases ?? []) {
    const list = aliasesByFacet.get(a.facet_id) ?? [];
    list.push(a.alias);
    aliasesByFacet.set(a.facet_id, list);
  }
  const facetValues: FacetFormValue[] = (facets ?? []).map((f) => ({
    ...f,
    aliases: aliasesByFacet.get(f.id) ?? [],
  }));

  const aiEnabled = settings?.ai_enabled ?? false;

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="text-ink font-serif text-2xl font-semibold">Settings</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Controlled vocabulary, tags, AI, and backup status.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-ink text-base font-semibold">Facets</h2>
          <p className="text-ink-muted text-sm">
            A controlled vocabulary you attach to cards. Aliases and transliterations
            help search find spelling variants.
          </p>
        </div>
        <FacetList facets={facetValues} />
        <div>
          <h3 className="text-ink mb-2 text-sm font-medium">Add a facet</h3>
          <FacetForm />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-ink text-base font-semibold">Tags</h2>
          <p className="text-ink-muted text-sm">
            Free-form vocabulary created as you tag cards.
          </p>
        </div>
        {tags && tags.length ? (
          <ul className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <li
                key={t.id}
                className="border-border bg-surface text-ink inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm"
              >
                <span dir="auto">{t.label}</span>
                <form action={deleteTagAction} className="inline">
                  <input type="hidden" name="tag_id" value={t.id} />
                  <ConfirmSubmit
                    size="sm"
                    variant="ghost"
                    message="Delete this tag? It is removed from any cards using it."
                    className="text-ink-faint hover:text-danger px-1"
                  >
                    ×
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted text-sm">No tags yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-ink text-base font-semibold">AI assistance</h2>
          <p className="text-ink-muted text-sm">
            Off by default. Rangkhaneh never sends card content or attachments to any AI
            provider automatically. Even when enabled, Phase 1 only builds a copyable
            prompt for you to use elsewhere — no automatic calls.
          </p>
        </div>
        <form
          action={setAiEnabledAction}
          className="border-border bg-surface flex items-center justify-between rounded-lg border p-4"
        >
          <label htmlFor="ai_enabled" className="text-ink text-sm">
            Enable optional AI assistance features
          </label>
          <div className="flex items-center gap-3">
            <input
              id="ai_enabled"
              name="ai_enabled"
              type="checkbox"
              defaultChecked={aiEnabled}
              className="accent-accent-soft h-4 w-4"
            />
            <button
              type="submit"
              className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-ink text-base font-semibold">Backup status</h2>
        <p className="text-ink-muted text-sm">
          Last successful export:{" "}
          {settings?.last_export_at ? formatDateTime(settings.last_export_at) : "never"}
          .
        </p>
        <a href="/export" className="text-lapis text-sm hover:underline">
          Go to Export &amp; Backup →
        </a>
      </section>
    </div>
  );
}
