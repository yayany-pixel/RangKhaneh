import type { Metadata } from "next";
import { getAuthedContext } from "@/lib/auth/session";
import { ImportPanel } from "@/components/export/import-panel";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Export & Backup — Rangkhaneh" };

export default async function ExportPage() {
  const { supabase } = await getAuthedContext();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("last_export_at")
    .maybeSingle();

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="text-ink font-serif text-2xl font-semibold">
          Export &amp; Backup
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          The archive must not become a prison. Everything here is yours to take with
          you — structured JSON that re-imports, plus human-readable Markdown and CSV,
          with original attachments preserved.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-ink text-base font-semibold">Full archive</h2>
        <p className="text-ink-muted text-sm">
          A ZIP containing a manifest, schema version, structured JSON, one Markdown
          file per card, a CSV of card metadata, and every original attachment.
        </p>
        <a
          href="/api/export"
          className="bg-accent hover:bg-accent/90 inline-block rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Download full archive (.zip)
        </a>
        <p className="text-ink-faint text-xs">
          Last successful export:{" "}
          {settings?.last_export_at ? formatDateTime(settings.last_export_at) : "never"}
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-ink text-base font-semibold">Cards</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export/cards?format=markdown"
            className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
          >
            Markdown (.md)
          </a>
          <a
            href="/api/export/cards?format=csv"
            className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
          >
            Metadata (.csv)
          </a>
          <a
            href="/api/export/cards?format=json"
            className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
          >
            Records (.json)
          </a>
        </div>
        <p className="text-ink-faint text-xs">
          Collections export in their manual order from each collection&rsquo;s page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-ink text-base font-semibold">Import</h2>
        <p className="text-ink-muted text-sm">
          Import a Rangkhaneh archive. The schema version is validated, a dry run
          previews the changes, and UUID conflicts are detected before anything is
          written.
        </p>
        <ImportPanel />
      </section>
    </div>
  );
}
