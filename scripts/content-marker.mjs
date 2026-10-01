// A short fingerprint of the database content that ends up in the static pages. The build records it
// in dist/build.json; scripts/rebuild-if-stale.ts compares it with the database to decide whether
// the site is out of date. Anything that adds, removes or changes a published page changes it.
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(resolve(".env"));
} catch {
  // .env is optional
}

async function newestAndCount(supabase, table, apply) {
  // Filters exist only on the builder returned by select(), so apply them after it.
  const [newest, count] = await Promise.all([
    apply(supabase.from(table).select("updated_at")).order("updated_at", { ascending: false }).limit(1),
    apply(supabase.from(table).select("id", { count: "exact", head: true })),
  ]);
  if (newest.error) throw newest.error;
  if (count.error) throw count.error;
  return `${newest.data?.[0]?.updated_at ?? "none"}|${count.count ?? 0}`;
}

async function countOnly(supabase, table) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function computeContentMarker() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required");
  const supabase = createClient(url, key);
  const [articles, facilities, sources, history] = await Promise.all([
    newestAndCount(supabase, "articles", (q) => q.eq("publication_status", "published")),
    newestAndCount(supabase, "data_centers", (q) => q.eq("listing_type", "facility")),
    countOnly(supabase, "data_center_sources"),
    countOnly(supabase, "data_center_status_history"),
  ]);
  return `a:${articles};f:${facilities};s:${sources};h:${history}`;
}
