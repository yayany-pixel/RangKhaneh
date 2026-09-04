import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cardToMarkdown,
  toCsv,
  CARD_CSV_COLUMNS,
  type ExportCard,
} from "@/lib/export/serialize";

const CARD_COLUMNS =
  "id,title,domain,card_type,workflow_status,epistemic_status,book_relation,original_content,working_content,exact_quote,paraphrase,translation,transliteration,summary,annotation,questions,why_it_matters,language_codes,historical_date_label,captured_at,created_at";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  const { data } = await supabase
    .from("cards")
    .select(CARD_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const cards = (data ?? []) as unknown as ExportCard[];
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new Response(
      toCsv(cards as unknown as Record<string, unknown>[], CARD_CSV_COLUMNS),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rangkhaneh-cards-${stamp}.csv"`,
        },
      },
    );
  }

  if (format === "markdown") {
    const body = cards.map((c) => cardToMarkdown(c)).join("\n---\n\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="rangkhaneh-cards-${stamp}.md"`,
      },
    });
  }

  return new Response(JSON.stringify(cards, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="rangkhaneh-cards-${stamp}.json"`,
    },
  });
}
