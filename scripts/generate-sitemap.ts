// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(resolve(".env"));
} catch {
  // .env is optional (e.g. CI may inject env vars directly)
}

const BASE_URL = process.env.SITE_URL || "https://pulsefeed-chronicle.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/intelligence", changefreq: "daily", priority: "0.9" },
  { path: "/insights", changefreq: "daily", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.6" },
  { path: "/stats", changefreq: "weekly", priority: "0.8" },
  { path: "/leaders", changefreq: "weekly", priority: "0.7" },
  { path: "/archive", changefreq: "daily", priority: "0.7" },
];

async function fetchLeaderEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("sitemap: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set, skipping dynamic leader URLs");
    return [];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("people").select("id").limit(1000);
  if (error || !data) {
    console.warn("sitemap: failed to fetch people for dynamic URLs:", error?.message);
    return [];
  }

  return data.map((person) => ({
    path: `/leaders/${person.id}`,
    changefreq: "weekly",
    priority: "0.5",
  }));
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
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

const leaderEntries = await fetchLeaderEntries();
const entries = [...staticEntries, ...leaderEntries];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries, ${leaderEntries.length} dynamic)`);
