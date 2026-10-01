import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import App from "./App";
import { articlesQueryOptions } from "./hooks/useArticles";
import { dailyDigestQueryOptions } from "./components/DailyDigest";

// Queries each pre-rendered route needs, so the HTML contains real content rather than
// loading skeletons. Keys must match what the components request (see their hooks).
async function prefetch(url: string, queryClient: QueryClient) {
  if (url !== "/") return;
  const queries = [
    articlesQueryOptions(undefined, 5),
    articlesQueryOptions(undefined, 10),
    articlesQueryOptions(undefined, 50),
    articlesQueryOptions("All", 50),
    dailyDigestQueryOptions,
  ];
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
  return { html, helmet: helmetContext.helmet, state: dehydrate(queryClient) };
}
