// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { FACILITY_COLUMNS, facilityPath, isIndexable, type Facility } from "../src/lib/facility";

try {
  process.loadEnvFile(resolve(".env"));
} catch {
  // .env is optional (e.g. CI may inject env vars directly)
}

// Update SITE_URL once the production domain is purchased/finalized.
const BASE_URL = process.env.SITE_URL || "https://data-center-insights-fawn.vercel.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/news", changefreq: "hourly", priority: "0.9" },
  { path: "/data", changefreq: "weekly", priority: "0.9" },
  { path: "/intelligence", changefreq: "daily", priority: "0.9" },
  { path: "/insights", changefreq: "daily", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.6" },
  { path: "/stats", changefreq: "weekly", priority: "0.8" },
  { path: "/leaders", changefreq: "weekly", priority: "0.7" },
  { path: "/archive", changefreq: "daily", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/about/methodology", changefreq: "monthly", priority: "0.5" },
];

// Privacy, Terms and Contact are noindex until the operator details are set (src/config/site.ts),
// so they only enter the sitemap once configured.
if (process.env.VITE_LEGAL_NAME && process.env.VITE_CONTACT_EMAIL && process.env.VITE_GOVERNING_LAW) {
  staticEntries.push(
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
    { path: "/contact", changefreq: "yearly", priority: "0.3" },
  );
}

async function fetchLeaderEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("sitemap: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set, skipping dynamic leader URLs");
    return [];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("people").select("id, last_mentioned").limit(1000);
  if (error || !data) {
    console.warn("sitemap: failed to fetch people for dynamic URLs:", error?.message);
    return [];
  }

  return data.map((person) => ({
    path: `/leaders/${person.id}`,
    lastmod: person.last_mentioned ? new Date(person.last_mentioned).toISOString().slice(0, 10) : undefined,
    changefreq: "weekly",
    priority: "0.5",
  }));
}

async function fetchStoryEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  // Published stories only: archived and rejected rows must never reach the sitemap.
  const { data, error } = await supabase
    .from("articles")
    .select("slug, updated_at, published_at")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false })
    .limit(5000);
  if (error || !data) {
    console.warn("sitemap: failed to fetch stories:", error?.message);
    return [];
  }

  return data.map((a) => ({
    path: `/news/${a.slug}`,
    lastmod: new Date(a.updated_at ?? a.published_at ?? Date.now()).toISOString().slice(0, 10),
    changefreq: "monthly",
    priority: "0.7",
  }));
}

async function fetchFacilityEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const [facilities, sources] = await Promise.all([
    supabase.from("data_centers").select(FACILITY_COLUMNS).eq("listing_type", "facility").limit(2000),
    supabase.from("data_center_sources").select("data_center_id").limit(5000),
  ]);
  if (facilities.error || sources.error || !facilities.data || !sources.data) {
    console.warn("sitemap: failed to fetch facilities:", facilities.error?.message ?? sources.error?.message);
    return [];
  }
  const counts: Record<string, number> = {};
  for (const s of sources.data) counts[s.data_center_id] = (counts[s.data_center_id] ?? 0) + 1;

  // Same rule as the page itself (src/lib/facility.ts): thin records are noindex, so they stay out.
  return (facilities.data as Facility[])
    .filter((f) => isIndexable(f, counts[f.id] ?? 0))
    .map((f) => ({
      path: facilityPath(f),
      lastmod: new Date(f.updated_at).toISOString().slice(0, 10),
      changefreq: "monthly",
      priority: "0.6",
    }));
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const storyEntries = await fetchStoryEntries();
const facilityEntries = await fetchFacilityEntries();
// Leader profiles are noindex until people are verified (LeaderProfile.tsx), so they stay out of
// the sitemap. fetchLeaderEntries is kept for when verification ships.
const entries = [...staticEntries, ...storyEntries, ...facilityEntries];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries: ${storyEntries.length} stories, ${facilityEntries.length} facilities)`);
