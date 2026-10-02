// Acceptance checks on the built site (dist/ and public/sitemap.xml). Run after `npm run build`:
//   npx tsx scripts/check-build.ts
// Exits 1 on any failure. Database checks need VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { FACILITY_COLUMNS, facilityPath, isIndexable, type Facility } from "../src/lib/facility";
import { isSitemapIndex, parseSitemapIndex, parseUrlset } from "../src/lib/sitemap";

try {
  process.loadEnvFile(resolve(".env"));
} catch {
  // .env is optional
}

const DIST = resolve("dist");
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://data-center-insights-fawn.vercel.app").replace(/\/$/, "");
const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "assets" ? [] : htmlFiles(p);
    return name.endsWith(".html") ? [p] : [];
  });
}

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
const routeOf = (file: string) => {
  const rel = "/" + relative(DIST, file).replace(/\\/g, "/").replace(/index\.html$/, "").replace(/\/$/, "");
  return rel === "/" ? "/" : rel;
};

// ---- 1. Every pre-rendered page ----
const pages = new Map<string, { html: string; indexable: boolean }>();
for (const file of htmlFiles(DIST)) {
  const name = relative(DIST, file);
  const html = readFileSync(file, "utf8");
  if (name === "spa.html") {
    if (!/<div id="root"><\/div>/.test(html)) fail("spa.html: #root is not empty (non-pre-rendered routes would show another page's content)");
    if (html.includes('rel="canonical"')) fail("spa.html: has a canonical (it is shared by many routes)");
    if (html.includes("__RQ_STATE__")) fail("spa.html: carries embedded page data");
    continue;
  }
  if (name === "404.html") continue;

  const route = routeOf(file);
  const where = `page ${route}`;
  if (count(html, /<title[ >]/g) !== 1) fail(`${where}: expected exactly one <title>, found ${count(html, /<title[ >]/g)}`);
  if (count(html, /<meta[^>]+name="description"/g) !== 1) fail(`${where}: expected exactly one meta description`);
  if (count(html, /<h1[ >]/g) !== 1) fail(`${where}: expected exactly one <h1>, found ${count(html, /<h1[ >]/g)}`);
  const canonicals = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/g)].map((m) => m[1]);
  if (canonicals.length !== 1) fail(`${where}: expected exactly one canonical, found ${canonicals.length}`);
  else if (canonicals[0] !== `${SITE_URL}${route === "/" ? "" : route}` && canonicals[0] !== `${SITE_URL}${route}`) {
    fail(`${where}: canonical ${canonicals[0]} does not match its own URL`);
  }
  const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/)?.[1] ?? "";
  if (robots !== "index, follow" && robots !== "noindex, nofollow") fail(`${where}: unexpected robots value "${robots}"`);
  const indexable = robots === "index, follow";
  if (/<meta[^>]*data-static-seo/.test(html)) fail(`${where}: leftover static fallback meta`);
  if (html.includes("__SITE_URL__")) fail(`${where}: unreplaced __SITE_URL__ placeholder`);
  // The homepage's secondary widgets (market signals, counts, sidebar) still load in the browser and
  // ship as skeletons; its main content is checked below instead. Known gap, tracked in the plan.
  if (route !== "/" && html.includes("animate-pulse")) fail(`${where}: loading skeleton in the pre-rendered HTML (data was not ready at build)`);
  if (route === "/" && count(html, /href="\/news\/[^"]+"/g) < 5) fail(`${where}: fewer than 5 story links in the pre-rendered homepage`);

  const body = html.slice(html.indexOf("<main"), html.indexOf("</main>") + 7) || html;
  const text = body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
  for (const bad of ["undefined", "[object Object]", "NaN", " null "]) {
    if (text.includes(bad)) fail(`${where}: page text contains "${bad.trim()}"`);
  }

  for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
      for (const block of Array.isArray(data) ? data : [data]) {
        if (!block["@context"] || !block["@type"]) fail(`${where}: JSON-LD block without @context/@type`);
      }
    } catch {
      fail(`${where}: JSON-LD does not parse`);
    }
  }
  if (indexable && count(html, /ld\+json/g) === 0) fail(`${where}: indexable page without JSON-LD`);
  if (!indexable && count(html, /ld\+json/g) > 0 && route.startsWith("/data/facilities/")) fail(`${where}: noindex facility page carries JSON-LD`);

  pages.set(route, { html, indexable });
}
// ---- 1b. Rebuild bookkeeping ----
const buildJson = existsSync(join(DIST, "build.json")) ? JSON.parse(readFileSync(join(DIST, "build.json"), "utf8")) : null;
if (!buildJson?.builtAt) fail("dist/build.json is missing or has no builtAt (the rebuild job needs it)");
else if (!buildJson.marker && process.env.VITE_SUPABASE_URL) fail("dist/build.json has no content marker, so the rebuild job would rebuild on every run");
const keyFile = readFileSync(resolve("public/indexnow-key.txt"), "utf8").trim();
if (!/^[a-zA-Z0-9-]{8,128}$/.test(keyFile)) fail("public/indexnow-key.txt is not a valid IndexNow key");
if (!existsSync(join(DIST, "indexnow-key.txt"))) fail("dist/indexnow-key.txt is missing (IndexNow cannot verify the site)");

if (pages.size < 10) fail(`only ${pages.size} pages were pre-rendered; expected the homepage, news, tracker and more`);

// ---- 2. Sitemap agrees with the pages ----
const readPublic = (name: string) => (existsSync(resolve("public", name)) ? readFileSync(resolve("public", name), "utf8") : "");
const sitemap = readPublic("sitemap.xml");
if (!sitemap) fail("public/sitemap.xml is missing");
const locs: string[] = [];
if (sitemap && !isSitemapIndex(sitemap)) fail("public/sitemap.xml is not a sitemap index");
else {
  const children = parseSitemapIndex(sitemap);
  if (children.length === 0) fail("the sitemap index lists no child sitemaps");
  for (const child of children) {
    const name = child.replace(SITE_URL, "").replace(/^\//, "");
    const xml = readPublic(name);
    if (!xml) fail(`child sitemap ${name} is listed in the index but missing`);
    locs.push(...parseUrlset(xml).map((u) => u.loc.replace(SITE_URL, "") || "/"));
  }
}
if (new Set(locs).size !== locs.length) fail("sitemap has duplicate URLs");
if (locs.some((l) => l.startsWith("/leaders/"))) fail("sitemap lists /leaders/ profiles (people stay noindex until verified)");
for (const loc of locs) {
  const page = pages.get(loc);
  // Pages that are client-rendered only (stats, leaders list, ...) have no static file and are skipped.
  if (page && !page.indexable) fail(`sitemap lists ${loc}, but the page is noindex`);
}
for (const [route, page] of pages) {
  if (page.indexable && !locs.includes(route)) fail(`indexable page ${route} is missing from the sitemap`);
}

// ---- 3. Database rules: only published stories, facility indexing rule ----
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.warn("check-build: Supabase env not set, skipping database checks");
} else {
  const supabase = createClient(url, key);
  const articles = await supabase.from("articles").select("slug, publication_status").limit(5000);
  if (articles.error || !articles.data) fail(`could not read articles: ${articles.error?.message}`);
  else {
    const published = new Set(articles.data.filter((a) => a.publication_status === "published").map((a) => a.slug));
    const notPublished = articles.data.filter((a) => a.publication_status !== "published").map((a) => a.slug);
    const builtStories = [...pages.keys()].filter((r) => r.startsWith("/news/")).map((r) => r.slice("/news/".length));
    for (const slug of builtStories) if (!published.has(slug)) fail(`story page /news/${slug} is built but the story is not published`);
    for (const slug of published) if (!builtStories.includes(slug)) fail(`published story ${slug} has no pre-rendered page`);
    for (const slug of notPublished) {
      if (pages.has(`/news/${slug}`) || locs.includes(`/news/${slug}`)) fail(`non-published story ${slug} reached the build or the sitemap`);
    }
  }

  const [facilities, sources] = await Promise.all([
    supabase.from("data_centers").select(FACILITY_COLUMNS).eq("listing_type", "facility").limit(2000),
    supabase.from("data_center_sources").select("data_center_id").limit(5000),
  ]);
  if (facilities.error || sources.error || !facilities.data || !sources.data) fail("could not read facilities");
  else {
    const counts: Record<string, number> = {};
    for (const s of sources.data) counts[s.data_center_id] = (counts[s.data_center_id] ?? 0) + 1;
    for (const f of facilities.data as Facility[]) {
      const route = facilityPath(f);
      const page = pages.get(route);
      if (!page) fail(`facility ${route} has no pre-rendered page`);
      else if (page.indexable !== isIndexable(f, counts[f.id] ?? 0)) fail(`facility ${route}: robots does not follow the completeness rule`);
    }
  }
}

if (failures.length) {
  console.error(`check-build: ${failures.length} problem(s)\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`check-build: ok (${pages.size} pages, ${locs.length} sitemap URLs)`);
