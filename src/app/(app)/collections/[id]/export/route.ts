import { createSupabaseServerClient } from "@/lib/supabase/server";
import { collectionToMarkdown, slugify, type ExportCard } from "@/lib/export/serialize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("id,title,description")
    .eq("id", id)
    .maybeSingle();
  if (!collection) {
    return new Response("Not found", { status: 404 });
  }

  const { data: items } = await supabase
    .from("collection_cards")
    .select("card_id,position")
    .eq("collection_id", id)
    .order("position", { ascending: true });
  const orderedIds = (items ?? []).map((i) => i.card_id);

  const { data: cardRows } = orderedIds.length
    ? await supabase.from("cards").select("*").in("id", orderedIds)
    : { data: [] as ExportCard[] };
  const byId = new Map(
    ((cardRows ?? []) as unknown as ExportCard[]).map((c) => [c.id, c]),
  );
  const ordered = orderedIds
    .map((cid) => byId.get(cid))
    .filter((c): c is ExportCard => Boolean(c));

  const format = new URL(request.url).searchParams.get("format") ?? "markdown";
  const name = slugify(collection.title, "collection");

  if (format === "json") {
    return new Response(JSON.stringify({ collection, cards: ordered }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}.json"`,
      },
    });
  }

  return new Response(collectionToMarkdown(collection, ordered), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.md"`,
    },
  });
}
