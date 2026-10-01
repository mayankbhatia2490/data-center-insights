# Rebuilds and search-engine pings

The site is pre-rendered, so a new story or facility change only shows in the static pages after a rebuild. This is how that happens and what you need to set up once.

## How it works

1. Every build writes `dist/build.json` with a **content marker**: the newest `updated_at` and the row count of published stories and facilities, plus the counts of facility sources and status changes. The marker is taken *before* pages are rendered, so a change during a build causes one extra rebuild instead of a missed one.
2. `.github/workflows/rebuild.yml` runs `scripts/rebuild-if-stale.ts` every 30 minutes. It reads the live `build.json`, computes the marker from the database now, and compares. Same marker: it stops. Different: it triggers a Vercel deploy hook.
3. A **daily forced rebuild** (03:17 UTC) runs even when nothing changed, as a safety net.
4. After the new build is live (it waits up to 15 minutes for `build.json` to change), the script compares the sitemap before and after and sends the new or changed URLs to **IndexNow** (Bing, Yandex and engines that use Bing's index). Google does not use IndexNow: it reads the sitemap, which now lists `lastmod` for every URL.
5. Sitemaps: `/sitemap.xml` is an index of `sitemap-pages.xml`, `sitemap-news.xml` and `sitemap-data.xml`. Only published stories and indexable facilities (5 or more of 10 key fields) are listed; people profiles are not.

Latency: a story published now reaches the live site within about 30 to 45 minutes. For near-instant updates, a database webhook that calls the same deploy hook on publish is the next step; it was left out because it means changing the pipeline functions.

## One-time setup (needs you)

1. **Vercel deploy hook.** Open the `mayankbhatia2490s-projects/data-center-insights` project > Settings > Git > **Deploy Hooks**. Name it `scheduled-rebuild`, branch `main`, create it, and copy the URL. Treat the URL as a secret: anyone with it can trigger builds.
2. **GitHub secret.** Repository > Settings > Secrets and variables > Actions > **Secrets** tab > New repository secret. Name `VERCEL_DEPLOY_HOOK_URL`, value the URL. (The Supabase values are repository *variables*; this one is a *secret*.)
3. **Check it.** Actions > "Rebuild if stale" > Run workflow. Leave `dry_run` ticked first: the log should say what it would do. Run it again with `dry_run` off to trigger a real rebuild and watch the IndexNow line at the end.
4. **Search Console and Bing Webmaster Tools.** Add the site, verify it, and submit `/sitemap.xml`. Both have a "Sitemaps" page. Bing can import a site from Search Console. Until you do this, nothing tells you whether pages are being indexed.
5. When the real domain is attached, set the repository variable `SITE_URL` to it (and `VITE_SITE_URL` in Vercel), and add the new domain to both webmaster tools.

Until step 2 is done the workflow still runs; it logs a warning that it cannot rebuild and changes nothing.

## Useful commands

```
DRY_RUN=true npx tsx scripts/rebuild-if-stale.ts          # report only
FORCE_REBUILD=true npx tsx scripts/rebuild-if-stale.ts    # needs VERCEL_DEPLOY_HOOK_URL
```

Both need `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the environment or `.env`.
