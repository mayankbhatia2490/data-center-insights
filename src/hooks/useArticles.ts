import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  image_url: string | null;
  published_at: string | null;
  read_time: string | null;
  created_at: string;
  sentiment: string | null;
  insight: string | null;
  source_excerpt: string | null;
  publication_status?: string | null;
  validation_status?: string | null;
  source_tier?: number | null;
  source_reliability_score?: number | null;
  meaning?: string | null;
  impact_summary?: string | null;
  claim_type?: string | null;
  named_entities?: { organizations?: string[]; places?: string[] } | null;
  importance_score?: number | null;
  confidence_score?: number | null;
  corroboration_count?: number | null;
  people?: { id: string; name: string }[];
}

// Shared with the build-time pre-render (src/entry-server.tsx), which prefetches these queries.
export const articlesQueryOptions = (category?: string, limit = 20) =>
  queryOptions({
    queryKey: ["articles", category, limit],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*, article_people(people(id, name))")
        .eq("publication_status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (category && category !== "All") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        people: (row.article_people ?? []).map((ap: any) => ap.people).filter(Boolean),
      })) as Article[];
    },
  });

export function useArticles(category?: string, limit = 20) {
  return useQuery({
    ...articlesQueryOptions(category, limit),
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
  });
}
