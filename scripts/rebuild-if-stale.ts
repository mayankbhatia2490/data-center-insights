// Rebuilds the site when the database has moved on since the last build, then tells IndexNow engines
// what changed. Run on a schedule by .github/workflows/rebuild.yml; safe to run by hand.
//
//   SITE_URL                  live site (default: the Vercel alias)
//   VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY   to fingerprint the database
//   VERCEL_DEPLOY_HOOK_URL    secret: the Vercel deploy hook for the production branch
//   FORCE_REBUILD=true        rebuild even if nothing changed (the daily safety net)
//   DRY_RUN=true              report what would happen, change nothing
import { changedUrls, isSitemapIndex, isStale, parseSitemapIndex, parseUrlset, type SitemapUrl } from "../src/lib/sitemap";
import { computeContentMarker } from "./content-marker.mjs";
import { submitIndexNow } from "./indexnow";

const SITE = (process.env.SITE_URL || "https://data-center-insights-fawn.vercel.app").replace(/\/$/, "");
const HOOK = process.env.VERCEL_DEPLOY_HOOK_URL;
const FORCE = process.env.FORCE_REBUILD === "true";
const DRY = process.env.DRY_RUN === "true";
const POLL_MS = 20_000;
const TIMEOUT_MS = 15 * 60_000;

const bust = (url: string) => `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function liveBuild(): Promise<{ builtAt?: string; marker?: string | null } | null> {
  try {
    const res = await fetch(bust(`${SITE}/build.json`));
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function sitemapSnapshot(): Promise<SitemapUrl[]> {
  const get = async (u: string) => {
    const res = await fetch(bust(u));
    if (!res.ok) throw new Error(`${u} returned ${res.status}`);
    return res.text();
  };
  const root = await get(`${SITE}/sitemap.xml`);
  if (!isSitemapIndex(root)) return parseUrlset(root);
  const children = await Promise.all(parseSitemapIndex(root).map(get));
  return children.flatMap(parseUrlset);
}

const live = await liveBuild();
const current = await computeContentMarker();
const stale = isStale(live?.marker, current, FORCE);
console.log(`live build: ${live ? `${live.builtAt} (marker ${live.marker ?? "none"})` : "no build.json found"}`);
console.log(`database:   marker ${current}`);

if (!stale) {
  console.log("up to date: nothing to do");
  process.exit(0);
}
console.log(FORCE ? "rebuilding: forced" : "rebuilding: content changed since the last build");

if (DRY) {
  console.log("dry run: not triggering a deploy");
  process.exit(0);
}
if (!HOOK) {
  // Scheduled runs would fail every half hour until the secret exists; say so once per run instead.
  console.log("::warning::VERCEL_DEPLOY_HOOK_URL is not set, so the site cannot be rebuilt automatically. See docs/rebuild-and-indexing.md.");
  process.exit(0);
}

const before = await sitemapSnapshot().catch((e) => {
  console.warn("could not read the current sitemap:", e.message);
  return [] as SitemapUrl[];
});

const hookRes = await fetch(HOOK, { method: "POST" });
if (!hookRes.ok) throw new Error(`deploy hook returned ${hookRes.status}`);
console.log("deploy triggered; waiting for the new build to go live");

const started = Date.now();
let after = live;
while (Date.now() - started < TIMEOUT_MS) {
  await sleep(POLL_MS);
  after = await liveBuild();
  if (after?.builtAt && after.builtAt !== live?.builtAt) break;
}
if (!after?.builtAt || after.builtAt === live?.builtAt) {
  throw new Error(`no new build went live within ${TIMEOUT_MS / 60_000} minutes`);
}
console.log(`new build live: ${after.builtAt}`);

const changed = changedUrls(before, await sitemapSnapshot());
console.log(`${changed.length} new or changed URLs`);
await submitIndexNow(SITE, changed);
