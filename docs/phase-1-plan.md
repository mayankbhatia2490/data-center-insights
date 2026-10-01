# Phase 1 plan: crawlable story, tracker and facility pages

Status: proposal for owner decision. Companion to `docs/technical-seo-spec.md` (what to build) and the design canvas (how it looks). Numbers below were read from the live Supabase project `jtsollavrhcobcmajyoa` on 2026-10-01.

## 1. What the data says (and why it changes the plan)

| Content | Live count | Implication |
|---|---|---|
| Stories, published | **15** (all `validated_specialist`, 24-30 Sep) | The only pages that can be indexed today |
| Stories, archived and rejected | 1,906 | Never index. They are legacy, unvalidated rows |
| Facilities | 111 (20 operational, 5 under construction, 2 planned, **84 stage unknown**) | Most pages would say "unknown" |
| Facilities with capacity | **3** | The tracker's main value (capacity and change) is mostly empty |
| Facilities with coordinates | 66 | |
| Facilities verified | **0** | The verification step has not produced results yet |
| Facility source rows | 92 | Some evidence exists |
| Facility status history | **1 row** | "What changed" has almost nothing to show yet |
| People | 362, **0 verified, 0 photos** | Stay `noindex` (privacy policy in the spec) |

Three consequences:

1. **A framework migration is not justified yet.** The spec recommended Next.js with on-demand regeneration for thousands of pages. With about 15 stories and 111 facilities, **pre-rendering to static HTML at build time and rebuilding when the pipeline publishes** gives crawlers and AI bots the same raw HTML at a fraction of the effort and risk. Revisit Next.js when published pages pass roughly 1,000, or when pages need per-user server logic.
2. **Content supply is the bottleneck, not rendering.** Fifteen stories in a week of publishing is the ceiling on search growth. Phase 1 therefore runs a **data-supply track** in parallel (section 6).
3. **A live claim is wrong and was wrong and is now fixed in code (Step 0).** The homepage says "1,919 MENA articles indexed & AI-analysed". That count (`src/pages/Index.tsx`) includes every row, archived or not; the true published number is 15. See Step 0.

## 2. Decision: how to produce crawlable HTML

| | A. Build-time pre-render on the current Vite app (recommended now) | B. Next.js with incremental regeneration | C. Do nothing |
|---|---|---|---|
| Effort | About 1 week | About 2-4 weeks | none |
| Code reuse | Almost all of `src/` | Most components, all routing and data fetching rewritten | |
| Freshness | Minutes to hours (rebuild on publish) | Seconds (on-demand revalidation) | |
| Scale ceiling | Comfortable to a few thousand pages | Tens of thousands | |
| Migration risk | Low (same router, same auth, same tests) | Medium (auth cookies, env vars, every route) | |
| Fit with today's data | Good | Over-built for 15 stories | Content invisible to bots that skip JavaScript |

**Recommendation: A**, with a half-day spike first to pick the tool (an established React Router static-site generator such as `vite-react-ssg`, or a small custom script using React's server renderer and `StaticRouter`). I have not tested either against this codebase, so the spike decides.

**Spike result (2026-10-01): custom script passes locally.** Used React's `renderToString` with `StaticRouter` and a small `scripts/prerender.mjs` instead of a framework plugin, because the app only needed four small changes: an injectable router in `App.tsx`, a browser-only `localStorage` guard in the Supabase client, a server-safe initial theme state in `Header`, and a lazy-loaded Stats page (Leaflet touches `window` at import). Measured on `/`, `/about`, `/about/methodology`, `/pricing` (checked over a static file server, not Vercel):
- Raw HTML contains the `<h1>` and body text on `/about`, `/pricing`, `/about/methodology`. **`/` has no `<h1>` at all** (a real gap to fix in Step 3).
- Browser hydration: no React errors or warnings; exactly one `<title>`, description and canonical per page after load.
- JSON-LD: present on `/` (2 blocks), **absent on the other pre-rendered pages**; per-template schema is Step 3 work.
- Full `npm run build` takes about 11 seconds.
- Only the public Supabase URL and publishable key are read at build; no secret is involved.
- Not yet verified: how Vercel serves `/about` (static file vs the explicit rewrite in `vercel.json`). The PR preview will show it.

**Spike exit criteria** (all must pass or we pick B): raw HTML for `/` and `/about` contains the `<h1>` and body text; no React hydration warnings; one canonical and one JSON-LD block per page; build under 3 minutes; Supabase data fetched at build with no secret exposed.

## 3. Scope

In Phase 1:
- Pre-rendered pages: Home, News index, **Story** (`/news/{slug}`), About, Methodology, Pricing, Tracker (`/data`), **Facility** (`/data/facilities/{country}/{slug}`), Briefings.
- Slug redirects from `slug_history`; permanent redirects for old routes (`/stats`, `/insights`, `/archive`).
- Sitemap index generated from the database (published and indexable rows only, with real `lastmod`).
- Structured data per template (NewsArticle, Place, Dataset, BreadcrumbList), per-page social images.
- Rebuild automation: the pipeline triggers a rebuild after it publishes.
- Indexing rules from the spec (facility completeness threshold, people stay `noindex`).

Not in Phase 1: Arabic, the people verification flow, Premium history and CSV, the transparency scorecard (needs verified data), the full visual redesign of every page.

## 4. Steps

**Step 0: trust and housekeeping (about 1 day).**
- Fix the homepage article count: count only `publication_status = 'published'`, or replace it with the real number of recent stories. Do not show an "indexed" claim at all until it is meaningful.
- Pick **one** production Vercel project. Two projects currently build every commit (`smms-projects-178b03ca` and `mayankbhatia2490s-projects`), which doubles builds and risks duplicate indexable URLs. Disable or delete the other.
- Attach the real domain; set `VITE_SITE_URL`, `SITE_URL`, and the three legal values.

**Step 1: spike (0.5-1 day).** Section 2 exit criteria. Output: a one-paragraph decision recorded in this file.

**Step 2: server-safe data layer (about 1 day).**
- A small module that creates a Supabase client for build time (no `localStorage`, reads env from Node) and typed fetchers: published stories, one story with people, facility list, one facility with sources and history.
- Only `publication_status = 'published'` stories are ever fetched for static output.
- Refactor the few browser-only components (`Header` theme toggle, `BottomSubscribeBar`, `BookmarkButton`, `ShareButtons`, `Seo`'s effect, `use-mobile`) so they render safely on the server and activate after hydration. Leaflet map and Recharts load only in the browser.

**Status (2026-10-01):** Step 2 started. Done: build-time prefetch of the homepage queries into the pre-rendered page (React Query state is embedded and hydrated), hydration-safe relative times and header date, a default WebPage and BreadcrumbList schema for every indexable page without its own, and a homepage `<h1>` (the featured story's headline, so it changes with each build). Not done: story, news-index, tracker and facility pages.

**Status update:** Step 3 built. `/news` and `/news/{slug}` are pre-rendered for every published story (15 today); the homepage, hero and cards link to them; unknown or old slugs resolve client-side through `slug_history` (a static host cannot send a true 301 from database rows); the sitemap lists published stories with `updated_at` as `lastmod`. Leader profiles are now `noindex` and out of the sitemap because no person is verified. Limits: an unknown slug returns HTTP 200 with a client-rendered 404 page (soft 404), and the story template only shows fields the data has (one-sentence summary, why it matters, source, tier, checks); corroboration is shown as "not yet checked" because the pipeline never sets it.

**Step 3: story pages and news index (about 2 days).** Template from the design canvas: "In short", "At a glance" table, why it matters, derivation chain using real fields (`source`, `source_tier`, `validation_status`, `confidence_score`, `corroboration_count`, `named_entities`), people and companies, source link, related stories. NewsArticle JSON-LD. Slug redirects.

**Step 4: tracker and facility pages (about 2-3 days).**
- Tracker index from the database. Completeness meter uses real numbers (coordinates 66/111, capacity 3/111, verified 0/111), not placeholders.
- Facility template with "Not disclosed" states. Indexable only when completeness meets the threshold; today very few will, so most are `noindex` until data improves.
- "What changed" feed reads `data_center_status_history`. With 1 row today, show a short honest empty state and hide the premium history teaser until data exists.

**Step 5: sitemap, rebuild and notification (about 1 day).** Sitemap index with separate files by type; deploy hook called by the pipeline functions after publishing (secret stored as an edge-function secret) plus a daily scheduled rebuild as a safety net; IndexNow ping for new and changed URLs; Search Console and Bing Webmaster verified.

**Step 6: quality gates (about 1 day).** Run the spec's acceptance tests (section 15 of the spec) in CI; Lighthouse CI on home, a story, the tracker, a facility; unit tests for slug lookup, redirect and indexability rules; a test that no archived or rejected story, and no unverified person, ever enters the output.

Rough total: **8-10 working days** for one developer working with an AI assistant, plus decisions and data work. These are estimates, not commitments; the spike may change them.

## 5. Design and theme

The approved visual direction is the light "Ledger" system (Fraunces and Atkinson Hyperlegible, warm paper, teal accent). The app today still uses the older dark navy theme. Two options:

- **Recommended:** change the shared design tokens, header and footer to Ledger as part of Step 2 so new and old pages look consistent, then apply page-level redesigns in Phase 2.
- Alternative: new templates only, accepting a visible mix of styles for a while.

## 6. Parallel track: data supply

Rendering does not create content. These need an owner and a target, set after reading the pipeline's health:

1. **Published stories:** why only 15 in the last week? Check discovery volume against the validation rules in `docs/reliable-news-validation.md`, and whether the schedules are running.
2. **Facility capacity:** 3 of 111. Check `extract-capacity` and the source rows (92 exist).
3. **Verification:** 0 verified of 111. Check that `verify-data-centers` is scheduled and running (its schedule depends on database settings per `docs/data-center-map.md`).
4. **Status history:** 1 row. The "what changed" product needs the status-history job running regularly.

Suggested success measures (targets to be set by the owner): published stories per week, facilities with capacity, facilities verified, status-history rows per week.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Pre-render and client output differ (hydration errors) | Spike criteria; keep data fetching identical on both sides |
| A secret leaks into static HTML | Only the public anon key is used at build; the rebuild hook secret lives in edge-function secrets |
| Thin facility pages dilute the site | Completeness threshold with `noindex` below it |
| Archived or rejected stories get indexed | Fetchers filter to `published`; test enforces it |
| Stale pages between rebuilds | Rebuild on publish plus daily; the client refreshes data after hydration |
| Slug or URL changes later | `slug_history` redirects; slugs never change automatically |
| Two Vercel projects confuse deploys and indexing | Step 0 |
| Content stays at about 15 stories | Section 6; do not oversell SEO impact until supply improves |

## 8. Decisions needed

Decided 2026-10-01: **Approach A (pre-render)**. Production Vercel project: **`mayankbhatia2490s-projects/data-center-insights`**; the `smms-projects-178b03ca` project is to be disabled by the owner. Still to confirm: that the production domain alias sits on the chosen project.

1. ~~Approach A (pre-render) over B (Next.js) for now?~~ Decided: A.
2. ~~Which Vercel project is production?~~ Decided (above). Domain attachment date still open.
3. Re-theme to Ledger first (recommended) or new templates only?
4. Facility indexing threshold (suggested: at least 5 of 10 key fields).
5. Rebuild cadence (on publish plus daily).
6. Owner and targets for the data-supply track.
