import { useQuery } from "@tanstack/react-query";
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
}

export function useArticles(category?: string, limit = 20) {
  return useQuery({
    queryKey: ["articles", category, limit],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (category && category !== "All") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
  });
}
