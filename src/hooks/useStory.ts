import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Article } from "./useArticles";

export type StoryResult =
  | { kind: "story"; article: Article }
  | { kind: "moved"; slug: string }
  | { kind: "missing" };

// Shared with the build-time pre-render. Only published stories are ever returned; an old slug
// resolves to the current one through slug_history so links never break when a slug changes.
export const storyQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["story", slug],
    queryFn: async (): Promise<StoryResult> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, article_people(people(id, name))")
        .eq("slug", slug)
        .eq("publication_status", "published")
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const row = data as typeof data & { article_people?: { people: { id: string; name: string } | null }[] };
        return {
          kind: "story",
          article: {
            ...(data as unknown as Article),
            people: (row.article_people ?? []).map((ap) => ap.people).filter((p): p is { id: string; name: string } => !!p),
          },
        };
      }

      const { data: moved, error: movedError } = await supabase
        .from("slug_history")
        .select("entity_id")
        .eq("entity", "article")
        .eq("old_slug", slug)
        .order("changed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (movedError) throw movedError;
      if (moved) {
        const { data: current } = await supabase
          .from("articles")
          .select("slug")
          .eq("id", moved.entity_id)
          .eq("publication_status", "published")
          .maybeSingle();
        if (current) return { kind: "moved", slug: current.slug };
      }
      return { kind: "missing" };
    },
  });

export function useStory(slug: string) {
  return useQuery(storyQueryOptions(slug));
}
