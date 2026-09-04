import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedContext } from "@/lib/auth/session";
import { CollisionForm } from "@/components/cards/collision-form";
import { ManualProvider } from "@/lib/analysis/provider";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  retestCollisionReportAction,
  deleteCollisionReportAction,
} from "@/app/(app)/cards/[id]/collision/actions";
import type { CollisionReportRow } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Collision report — Rangkhaneh" };

const CARD_FIELDS =
  "id,title,domain,card_type,original_content,working_content,exact_quote,paraphrase,translation,summary";
const CONSTITUTION_FIELDS =
  "id,version_name,is_current,project_description,central_questions,provisional_thesis,counter_theses,accepted_claims,rejected_claims,body_markdown";

export default async function CollisionReportPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const { id, reportId } = await params;
  const { supabase } = await getAuthedContext();

  const { data: report } = await supabase
    .from("collision_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();
  if (!report) notFound();

  const { data: card } = await supabase
    .from("cards")
    .select(CARD_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (!card) notFound();

  const { data: constitutions } = await supabase
    .from("book_constitutions")
    .select(CONSTITUTION_FIELDS)
    .order("created_at", { ascending: false });

  const list = constitutions ?? [];
  const linked =
    list.find((c) => c.id === report.constitution_id) ??
    list.find((c) => c.is_current) ??
    null;
  const aiPrompt = ManualProvider.buildCollisionPrompt({
    card,
    constitution: linked,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/cards/${id}`} className="text-lapis text-sm hover:underline">
            ← Back to card
          </Link>
          <h1 className="text-ink mt-2 font-serif text-2xl font-semibold">
            Collision report
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Status: {report.status}
            {report.authorship !== "manual" ? ` · ${report.authorship}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={retestCollisionReportAction}>
            <input type="hidden" name="card_id" value={id} />
            <input type="hidden" name="report_id" value={reportId} />
            <button
              type="submit"
              className="border-border text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
            >
              Retest against current
            </button>
          </form>
          <form action={deleteCollisionReportAction}>
            <input type="hidden" name="card_id" value={id} />
            <input type="hidden" name="report_id" value={reportId} />
            <ConfirmSubmit
              size="sm"
              variant="danger"
              message="Delete this collision report? This cannot be undone."
            >
              Delete
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      <CollisionForm
        cardId={id}
        report={report as CollisionReportRow}
        constitutions={list.map((c) => ({
          id: c.id,
          version_name: c.version_name,
          is_current: c.is_current,
        }))}
        defaultConstitutionId={linked?.id ?? null}
        aiPrompt={aiPrompt}
      />
    </div>
  );
}
