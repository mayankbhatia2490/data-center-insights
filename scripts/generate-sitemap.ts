// Runs before `vite dev` and `vite build` (predev/prebuild hooks). Writes public/sitemap.xml (an index)
// and three child sitemaps by type: pages, news and data.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { FACILITY_COLUMNS, facilityPath, isIndexable, type Facility } from "../src/lib/facility";
import { buildSitemapIndex, buildUrlset, maxDate, type SitemapUrl } from "../src/lib/sitemap";

try {
  process.loadEnvFile(resolve(".env"));
} catch {
  // .env is optional (e.g. CI may inject env vars directly)
}

// Update SITE_URL once the production domain is purchased/finalized.
const BASE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://data-center-insights-fawn.vercel.app").replace(/\/$/, "");

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key) : null;
if (!supabase) console.warn("sitemap: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set, skipping stories and facilities");

const entry = (path: string, changefreq: string, priority: string, lastmod?: string): SitemapUrl => ({
  loc: `${BASE_URL}${path}`,
  lastmod,
  changefreq,
  priority,
});

async function fetchStories(): Promise<{ urls: SitemapUrl[]; newest?: string }> {
  if (!supabase) return { urls: [] };
  // Published stories only: archived and rejected rows must never reach the sitemap.
  const { data, error } = await supabase
    .from("articles")
    .select("slug, updated_at, published_at")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false })
    .limit(5000);
  if (error || !data) {
    console.warn("sitemap: failed to fetch stories:", error?.message);
    return { urls: [] };
  }
  const urls = data.map((a) => entry(`/news/${a.slug}`, "monthly", "0.7", new Date(a.updated_at ?? a.published_at ?? Date.now()).toISOString().slice(0, 10)));
  return { urls, newest: maxDate(urls.map((u) => u.lastmod)) };
}

async function fetchFacilities(): Promise<{ urls: SitemapUrl[]; newest?: string }> {
  if (!supabase) return { urls: [] };
  const [facilities, sources] = await Promise.all([
    supabase.from("data_centers").select(FACILITY_COLUMNS).eq("listing_type", "facility").limit(2000),
    supabase.from("data_center_sources").select("data_center_id").limit(5000),
  ]);
  if (facilities.error || sources.error || !facilities.data || !sources.data) {
    console.warn("sitemap: failed to fetch facilities:", facilities.error?.message ?? sources.error?.message);
    return { urls: [] };
  }
  const counts: Record<string, number> = {};
  for (const s of sources.data) counts[s.data_center_id] = (counts[s.data_center_id] ?? 0) + 1;

  const all = facilities.data as Facility[];
  // Same rule as the page itself (src/lib/facility.ts): thin records are noindex, so they stay out.
  const urls = all
    .filter((f) => isIndexable(f, counts[f.id] ?? 0))
    .map((f) => entry(facilityPath(f), "monthly", "0.6", new Date(f.updated_at).toISOString().slice(0, 10)));
  return { urls, newest: maxDate(all.map((f) => new Date(f.updated_at).toISOString().slice(0, 10))) };
}

const stories = await fetchStories();
const facilities = await fetchFacilities();

// Leader profiles are noindex until people are verified (LeaderProfile.tsx), so they stay out.
const pages: SitemapUrl[] = [
  entry("/", "hourly", "1.0", stories.newest),
  entry("/intelligence", "daily", "0.9"),
  entry("/insights", "daily", "0.8"),
  entry("/pricing", "monthly", "0.6"),
  entry("/stats", "weekly", "0.8"),
  entry("/leaders", "weekly", "0.7"),
  entry("/archive", "daily", "0.7"),
  entry("/about", "monthly", "0.5"),
  entry("/about/methodology", "monthly", "0.5"),
];

// Privacy, Terms and Contact are noindex until the operator details are set (src/config/site.ts),
// so they only enter the sitemap once configured.
if (process.env.VITE_LEGAL_NAME && process.env.VITE_CONTACT_EMAIL && process.env.VITE_GOVERNING_LAW) {
  pages.push(entry("/privacy", "yearly", "0.3"), entry("/terms", "yearly", "0.3"), entry("/contact", "yearly", "0.3"));
}

const news: SitemapUrl[] = [entry("/news", "hourly", "0.9", stories.newest), ...stories.urls];
const data: SitemapUrl[] = [entry("/data", "weekly", "0.9", facilities.newest), ...facilities.urls];

const files = [
  { name: "sitemap-pages.xml", urls: pages },
  { name: "sitemap-news.xml", urls: news },
  { name: "sitemap-data.xml", urls: data },
];
for (const f of files) writeFileSync(resolve("public", f.name), buildUrlset(f.urls));
writeFileSync(
  resolve("public/sitemap.xml"),
  buildSitemapIndex(files.map((f) => ({ loc: `${BASE_URL}/${f.name}`, lastmod: maxDate(f.urls.map((u) => u.lastmod)) }))),
);
console.log(`sitemap written: index + ${files.map((f) => `${f.name} (${f.urls.length})`).join(", ")}`);
