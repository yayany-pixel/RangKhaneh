import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CardRow } from "@/lib/supabase/database.types";
import { queryTerms } from "@/lib/search/normalize";

export const CARD_LIST_COLUMNS =
  "id,title,domain,card_type,workflow_status,epistemic_status,book_relation,original_content,is_favorite,captured_at";

export type CardSummary = Pick<
  CardRow,
  | "id"
  | "title"
  | "domain"
  | "card_type"
  | "workflow_status"
  | "epistemic_status"
  | "book_relation"
  | "original_content"
  | "is_favorite"
  | "captured_at"
>;

export type CardFilters = {
  q?: string;
  domain?: string;
  card_type?: string;
  status?: string;
  epistemic?: string;
  relation?: string;
  language?: string;
  source?: string;
  tag?: string;
  facet?: string;
  collection?: string;
  section?: string;
  needs?: string; // 'source' | 'verification' | 'review'
  favorite?: boolean;
  hasAttachment?: boolean;
  includeDeleted?: boolean;
  sort?: string; // 'recent' | 'captured' | 'title' | 'updated'
  limit?: number;
};

type Client = SupabaseClient<Database>;

async function cardIdsFromJoin(
  supabase: Client,
  table: "card_tags" | "card_facets" | "collection_cards" | "card_book_links",
  column: string,
  value: string,
): Promise<string[]> {
  const { data } = await supabase.from(table).select("card_id").eq(column, value);
  return (data ?? []).map((r) => r.card_id);
}

export async function queryCards(supabase: Client, filters: CardFilters) {
  const terms = filters.q ? queryTerms(filters.q) : [];

  let query = supabase.from("cards").select(CARD_LIST_COLUMNS, { count: "exact" });

  query = filters.includeDeleted
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  // Full-text-ish matching against the normalized copy. The trigram GIN index
  // on search_all backs these ILIKE lookups; matching each term with AND.
  for (const term of terms) {
    query = query.ilike("search_all", `%${term}%`);
  }

  if (filters.domain) query = query.eq("domain", filters.domain);
  if (filters.card_type) query = query.eq("card_type", filters.card_type);
  if (filters.status) query = query.eq("workflow_status", filters.status);
  if (filters.epistemic) query = query.eq("epistemic_status", filters.epistemic);
  if (filters.relation) query = query.eq("book_relation", filters.relation);
  if (filters.source) query = query.eq("source_id", filters.source);
  if (filters.language) query = query.contains("language_codes", [filters.language]);
  if (filters.favorite) query = query.eq("is_favorite", true);

  if (filters.needs === "source") query = query.is("source_id", null);
  if (filters.needs === "verification")
    query = query.eq("epistemic_status", "unreviewed");
  if (filters.needs === "review") {
    query = query
      .not("next_review_at", "is", null)
      .lte("next_review_at", new Date().toISOString());
  }

  // Membership filters resolve to a set of card ids first.
  const idSets: string[][] = [];
  if (filters.tag)
    idSets.push(await cardIdsFromJoin(supabase, "card_tags", "tag_id", filters.tag));
  if (filters.facet)
    idSets.push(
      await cardIdsFromJoin(supabase, "card_facets", "facet_id", filters.facet),
    );
  if (filters.collection)
    idSets.push(
      await cardIdsFromJoin(
        supabase,
        "collection_cards",
        "collection_id",
        filters.collection,
      ),
    );
  if (filters.section)
    idSets.push(
      await cardIdsFromJoin(supabase, "card_book_links", "section_id", filters.section),
    );

  if (idSets.length > 0) {
    let allowed = idSets[0];
    for (let i = 1; i < idSets.length; i++) {
      const set = new Set(idSets[i]);
      allowed = allowed.filter((id) => set.has(id));
    }
    if (allowed.length === 0) return { cards: [] as CardSummary[], terms, count: 0 };
    query = query.in("id", allowed);
  }

  if (filters.hasAttachment) {
    const { data } = await supabase.from("attachments").select("card_id");
    const withAtt = Array.from(new Set((data ?? []).map((r) => r.card_id)));
    if (withAtt.length === 0) return { cards: [] as CardSummary[], terms, count: 0 };
    query = query.in("id", withAtt);
  }

  switch (filters.sort) {
    case "captured":
      query = query.order("captured_at", { ascending: false });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "updated":
      query = query.order("updated_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.limit(filters.limit ?? 50);

  const { data, count } = await query;
  return {
    cards: (data ?? []) as unknown as CardSummary[],
    terms,
    count: count ?? 0,
  };
}
