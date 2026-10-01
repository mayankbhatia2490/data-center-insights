import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import App from "./App";
import { articlesQueryOptions } from "./hooks/useArticles";
import { dailyDigestQueryOptions } from "./components/DailyDigest";
import { storyQueryOptions } from "./hooks/useStory";
import { supabase } from "./integrations/supabase/client";

// Queries each pre-rendered route needs, so the HTML contains real content rather than
// loading skeletons. Keys must match what the components request (see their hooks).
async function prefetch(url: string, queryClient: QueryClient) {
  const storySlug = url.startsWith("/news/") ? url.slice("/news/".length) : null;
  let queries: { queryKey: readonly unknown[] }[] = [];
  if (url === "/") {
    queries = [
      articlesQueryOptions(undefined, 5),
      articlesQueryOptions(undefined, 10),
      articlesQueryOptions(undefined, 50),
      articlesQueryOptions("All", 50),
      dailyDigestQueryOptions,
    ];
  } else if (url === "/news") {
    queries = [articlesQueryOptions(undefined, 50)];
  } else if (storySlug) {
    queries = [storyQueryOptions(storySlug), articlesQueryOptions(undefined, 50)];
  }
  await Promise.all(queries.map((q) => queryClient.prefetchQuery(q as never)));
  for (const q of queries) {
    const state = queryClient.getQueryState(q.queryKey);
    if (state?.status === "error") console.warn(`prefetch failed for ${JSON.stringify(q.queryKey)}:`, state.error);
  }
}

export async function render(url: string) {
  const queryClient = new QueryClient();
  await prefetch(url, queryClient);
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <App
        queryClient={queryClient}
        Router={({ children }) => <StaticRouter location={url}>{children}</StaticRouter>}
      />
    </HelmetProvider>,
  );
  // A story page is only worth writing when its story was found; otherwise the build skips it
  // and the client-side route (vercel.json rewrite) handles it.
  const story = url.startsWith("/news/") ? queryClient.getQueryData<{ kind: string }>(["story", url.slice("/news/".length)]) : null;
  const ready = !url.startsWith("/news/") || story?.kind === "story";
  return { html, helmet: helmetContext.helmet, state: dehydrate(queryClient), ready };
}

// Slugs of every published story, used by the pre-render to decide which story pages to write.
export async function getPublishedSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => r.slug).filter(Boolean);
}
