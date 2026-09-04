/**
 * Search service interface.
 *
 * Phase 1 uses {@link keywordSearchService}, backed by PostgreSQL full-text +
 * pg_trgm fuzzy matching via {@link queryCards}. The interface exists so a
 * hybrid keyword/semantic service can be dropped in later (Phase 3) with no
 * UI rewrite: callers depend on this shape, not on the implementation.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { queryCards, type CardFilters } from "@/lib/data/cards";

type Client = SupabaseClient<Database>;

export interface SearchService {
  readonly id: string;
  readonly supportsSemantic: boolean;
  search(
    supabase: Client,
    filters: CardFilters,
  ): Promise<Awaited<ReturnType<typeof queryCards>>>;
}

export const keywordSearchService: SearchService = {
  id: "keyword",
  supportsSemantic: false,
  async search(supabase, filters) {
    return queryCards(supabase, filters);
  },
};

export const searchService: SearchService = keywordSearchService;
