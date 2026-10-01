import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import App from "./App";
import { articlesQueryOptions } from "./hooks/useArticles";
import { dailyDigestQueryOptions } from "./components/DailyDigest";
import { storyQueryOptions } from "./hooks/useStory";
import { supabase } from "./integrations/supabase/client";
import {
  facilityQueryOptions,
  fetchTrackerData,
  resolveFacility,
  trackerQueryOptions,
  type FacilitySource,
  type TrackerData,
} from "./hooks/useFacilities";
import { facilityPath } from "./lib/facility";

// The tracker is read once per build and shared by /data and every facility page.
let trackerBundle: Promise<{ tracker: TrackerData; sources: Map<string, FacilitySource[]> }> | null = null;
function loadTracker() {
  trackerBundle ??= (async () => {
    const [tracker, sourcesRes] = await Promise.all([
      fetchTrackerData(),
      supabase
        .from("data_center_sources")
        .select("id, data_center_id, source_name, source_title, source_type, source_url, review_status, checked_at")
        .order("created_at")
        .limit(5000),
    ]);
    if (sourcesRes.error) throw sourcesRes.error;
    const sources = new Map<string, FacilitySource[]>();
    for (const row of sourcesRes.data ?? []) sources.set(row.data_center_id, [...(sources.get(row.data_center_id) ?? []), row]);
    return { tracker, sources };
  })();
  return trackerBundle;
}

// Queries each pre-rendered route needs, so the HTML contains real content rather than
// loading skeletons. Keys must match what the components request (see their hooks).
async function prefetch(url: string, queryClient: QueryClient) {
  const storySlug = url.startsWith("/news/") ? url.slice("/news/".length) : null;
  const facilityMatch = url.match(/^\/data\/facilities\/([^/]+)\/([^/]+)$/);
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
  } else if (url === "/data") {
    const { tracker } = await loadTracker();
    queryClient.setQueryData(trackerQueryOptions.queryKey, tracker);
  } else if (facilityMatch) {
    const { tracker, sources } = await loadTracker();
    const [, country, slug] = facilityMatch;
    const found = tracker.facilities.find((f) => f.slug === slug && facilityPath(f) === `/data/facilities/${country}/${slug}`);
    queryClient.setQueryData(
      facilityQueryOptions(country, slug).queryKey,
      resolveFacility(tracker, country, slug, found ? (sources.get(found.id) ?? []) : []),
    );
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
  const facilityMatch = url.match(/^\/data\/facilities\/([^/]+)\/([^/]+)$/);
  const facility = facilityMatch ? queryClient.getQueryData<{ kind: string }>(facilityQueryOptions(facilityMatch[1], facilityMatch[2]).queryKey) : null;
  const ready = (!url.startsWith("/news/") || story?.kind === "story") && (!facilityMatch || facility?.kind === "facility");
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

// Every facility record gets a page; thin ones are written too but marked noindex by the page itself.
export async function getFacilityRoutes(): Promise<string[]> {
  const { tracker } = await loadTracker();
  return tracker.facilities.map((f) => facilityPath(f));
}
