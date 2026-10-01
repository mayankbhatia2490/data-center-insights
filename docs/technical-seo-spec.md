# Technical SEO, AEO and GEO spec

Scope: how Data Center Pulse should be built so search engines, answer engines and AI assistants can crawl, understand and cite it. Companion to `docs/website-audit.md` (findings) and the design canvas (screens). Where something is a decision for the owner it is marked **Decision**. Where a value is unknown it is bracketed.

## 1. Goals and non-goals

Goals
1. Every public page is fully present in the **raw HTML response**, with no JavaScript needed to see the headline, body, data table or links.
2. One clean, stable, canonical URL per piece of content, and a correct status code for everything else.
3. Pages that are easy to quote: answer first, dated, sourced, consistently named.
4. Measurable: we can tell what is crawled, indexed and cited, and fix it.

Non-goals: keyword stuffing, programmatic thin pages, scraping-and-republishing source articles, or any promise of a ranking or an AI citation. Nobody can guarantee those. This spec removes technical blockers and raises the odds.

## 2. Current state (evidence)

From the repo and the rendered audit of production (`data-center-insights-fawn.vercel.app`):

| Finding | Evidence | Effect |
|---|---|---|
| Client-rendered SPA (Vite + React Router) | `vite.config.ts`, `vercel.json` rewrites everything to `index.html` | Content needs JavaScript. Google can render it later; many AI crawlers do not render JS reliably. |
| Two canonical and two `og:url` tags on every non-home page | `index.html` hard-codes `/`; `Seo.tsx` adds another | Conflicting canonicals can fold pages into the homepage. |
| Unknown URLs return HTTP 200 with the homepage title | Rewrite catch-all | Soft 404s waste crawl budget and pollute the index. |
| `og:image` is a signed Google Cloud URL that expired 2026-02-21 | `index.html` | No image in social previews. |
| No per-article pages | Every card links to the source site | Nothing to rank for long-tail queries. |
| `articles` has no `slug` or `updated_at`; `data_centers` and `people` have no `slug` | `src/integrations/supabase/types.ts` | Cannot make stable readable URLs or honest `dateModified`. |
| Sitemap generated only at build, no `lastmod`, only static routes plus up to 1,000 people | `scripts/generate-sitemap.ts` | Stale between deploys; no article or facility URLs. |
| Committed `public/sitemap.xml` lists another domain | `pulsefeed-chronicle.lovable.app` | Overwritten by the build, but confusing. Delete it from git. |
| Production lives on `*.vercel.app`; two Vercel projects both build previews | PR checks | Domain not final; preview URLs may be indexable duplicates. |
| `llms.txt` and `robots.txt` exist | `public/` | Good start; `llms.txt` lists only the old routes. |

## 3. Architecture decision

**Requirement:** server-rendered or pre-rendered HTML for every public page, refreshed when the data pipeline publishes.

| Option | Pros | Cons |
|---|---|---|
| **A. Next.js (App Router) on Vercel, incremental static regeneration** | Same React and Tailwind and shadcn code; per-page `generateMetadata`; on-demand revalidation when the pipeline writes; route handlers for sitemaps; `next/og` for images; `next/font`. | Migration work: routing, data fetching, auth cookies. |
| B. Astro (content-first) | Excellent HTML and speed; islands for interactive parts. | New framework; rewrite of every component; auth and dashboards are awkward. |
| C. Keep Vite and add build-time prerender | Smallest change. | Every data change needs a rebuild; thousands of pages make builds slow; stale content. |

**Recommendation: A.** Public read routes become server components reading Supabase; interactive parts (filters, charts, the map, chat) stay as client components loaded lazily. Authenticated and admin routes can stay client-only behind `noindex`.

**Decision:** confirm Next.js before any article-page work. Do the Phase 0 fixes (section 14) on the current app first, because they help immediately.

## 4. URL structure

Lowercase, hyphenated, no trailing slash, no tracking parameters in canonicals.

| Content | URL | Notes |
|---|---|---|
| Home | `/` | |
| News index | `/news` | Filters as real paths where useful: `/news/topic/ai`, `/news/region/middle-east`. Pagination `?page=2`. |
| Story | `/news/{slug}-{shortid}` | `shortid` = first 8 chars of the id. Slug is created once and never changed. If the title changes, keep the old URL (301 to the current one). |
| Intelligence | `/intelligence` | Pulse Index, signals (gated), outlook. |
| Tracker | `/data` | Replaces `/stats`. |
| Facility | `/data/facilities/{country}/{slug}` | e.g. `/data/facilities/bahrain/aws-bah-zallaq`. |
| Operator | `/data/operators/{slug}` | Aggregates facilities; this page is the natural home for operator-level numbers. |
| Scorecard | `/data/capacity-transparency` | Indexable only after verification and right of reply. |
| Leaders | `/leaders`, `/leaders/{slug}` | See indexing rules (section 7). |
| Briefings | `/briefings`, `/briefings/{yyyy-mm-dd}` | Replaces `/archive`. One URL per day. |
| Events | `/events` | |
| Pricing, About, Methodology, Privacy, Terms, Contact | `/pricing`, `/about`, `/about/methodology`, `/privacy`, `/terms`, `/contact` | |
| App | `/login`, `/account`, `/admin/*` | `noindex`. |

Redirects (301, permanent): `/stats` to `/data`; `/insights` to `/intelligence`; `/archive` to `/briefings`; `/leaders/{uuid}` to `/leaders/{slug}`; old story ids to new slugs.

Schema changes (applied 2026-10-01, see `supabase/migrations/20261001060500_slugs_and_updated_at.sql`): `slug` on `articles`, `data_centers` and `people`; `updated_at` on `articles`; `slug_history` for redirects. `articles.slug` already contains the 8-character id suffix, so the full URL segment is `articles.slug`; facilities are unique per country; people are globally unique. `updated_at` moves only when content changes, not on pipeline bookkeeping fields. Operators still need their own slug (a view or table) before `/data/operators/{slug}`.

## 5. Rendering and caching

| Route | Render | Revalidate |
|---|---|---|
| `/`, `/news`, `/intelligence`, `/briefings` | ISR | On-demand when the pipeline publishes; fallback every 10 minutes |
| `/news/{slug}` | ISR | On-demand on edit; otherwise 1 hour |
| `/data`, facility, operator | ISR | On-demand when `data_centers` changes; fallback 1 hour |
| `/leaders/{slug}` | ISR | 6 hours |
| Static pages | Static | On deploy |
| `/account`, `/admin/*`, `/login` | Client, `noindex` | n/a |

Revalidation hook: after each pipeline function writes rows, it calls a protected `POST /api/revalidate` with a secret and the affected paths. No secret appears in client code.

Never gate content behind client-side rendering. Premium content shows its teaser server-side and is marked with `isAccessibleForFree` structured data (section 8) so the paywall is not treated as cloaking.

## 6. Metadata

One source of truth: `generateMetadata` per route. Delete the static canonical, `og:url` and `og:image` tags from `index.html`.

- **Title:** `{Page title} | Data Center Pulse`, 50 to 60 characters before the brand. Story: the headline. Facility: `{Facility}, {City}: capacity, status and history`. Never the same title twice.
- **Description:** 120 to 155 characters, unique, written from the page's "In short" text.
- **Canonical:** absolute URL on the production domain, one per page, self-referencing; no query strings except `?page=` on paginated lists.
- **Open Graph and Twitter:** `og:type` (`article` for stories, `profile` for people, otherwise `website`), `og:title`, `og:description`, `og:url`, `og:image` (1200x630, own hosted), `article:published_time`, `article:modified_time`, `twitter:card=summary_large_image`.
- **Robots meta:** `index,follow` by default; per-route overrides in section 7.
- **`lang`:** `en` now. For Arabic, see section 12.
- **Social image per page:** generated at request time (`next/og`): headline plus the data point for facilities and scorecard. Host on our domain; never a signed or expiring URL.

## 7. Indexing rules

| Page | Rule |
|---|---|
| Stories | Index. |
| Facilities | Index only if record completeness is at least **[threshold]** of 10 fields (suggest 5); else `noindex,follow` until it fills. Thin pages hurt more than they help. |
| Operators, tracker, intelligence, briefings | Index. |
| Scorecard | `noindex` until figures are verified and operators have had the right of reply. |
| Leaders | **Decision (privacy):** index a profile only when the person has verified it or it is evidence-checked and about a public role. Unverified, AI-extracted profiles of individuals stay `noindex`. Check data-protection obligations (UAE PDPL, GDPR for EU subjects) with a lawyer before indexing personal data. |
| Filtered or sorted list views | `noindex,follow`; canonical to the unfiltered list. |
| Search results, `/login`, `/account`, `/admin/*`, `/api/*` | `noindex`. |
| Non-production hosts (all `*.vercel.app` previews, staging) | `X-Robots-Tag: noindex` for every response. Verify in Vercel headers config that a host-conditional header applies. |
| Unknown URLs | Real HTTP 404 with a helpful page (search, popular links). Gone content: 410. |

## 8. Structured data (JSON-LD)

Render in the server HTML. Validate with Google's Rich Results Test and schema.org's validator. Only mark up what is visible on the page.

- **Site-wide:** `Organization` (name, url, logo, `sameAs` for real profiles, contact), `WebSite` (name, url).
- **Every page below the homepage:** `BreadcrumbList` matching the visible breadcrumb.
- **Story:** `NewsArticle` with `headline`, `description`, `datePublished`, `dateModified`, `author` (organization, not a fake person), `publisher`, `image`, `mainEntityOfPage`, `isBasedOn` (the source URL), `articleSection`, `about` (companies, places).
- **Facility:** `Place` (name, address, `geo` only when exact) with `additionalProperty` for capacity (value, unit MW, source) and an `Organization` operator link. Do not emit properties we do not have; omit instead of using `null` or "n/d".
- **Tracker and scorecard:** `Dataset` (name, description, `creator`, `dateModified`, `temporalCoverage`, `spatialCoverage`, `variableMeasured`, `license`, `distribution` for the CSV once public). Datasets are the best fit for the data we own.
- **Person:** `Person` only for indexed profiles; `sameAs` with the LinkedIn URL only when the person provided and verified it.
- **Paywalled sections:** `isAccessibleForFree: false` with `hasPart` and `cssSelector` for the gated block, on pages that show a teaser.
- **Reader Q&A:** `FAQPage` only when the questions and answers are visible. Google shows FAQ rich results for few sites, so treat this as clarity for answer engines, not a rich-result play.

Example (`NewsArticle`, abbreviated):

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "VDURA gallops into GPU-using Neocloud and enterprise market",
  "datePublished": "[ISO date]",
  "dateModified": "[ISO date]",
  "author": { "@type": "Organization", "name": "Data Center Pulse" },
  "publisher": { "@type": "Organization", "name": "Data Center Pulse",
    "logo": { "@type": "ImageObject", "url": "https://[domain]/logo.png" } },
  "image": ["https://[domain]/og/news/[slug].png"],
  "mainEntityOfPage": "https://[domain]/news/[slug]-[shortid]",
  "isBasedOn": "[source URL]"
}
```

## 9. Sitemaps, robots, llms.txt

- **Sitemap index** at `/sitemap.xml` pointing to: `sitemap-pages.xml`, `sitemap-news.xml`, `sitemap-facilities.xml`, `sitemap-operators.xml`, `sitemap-people.xml`, `sitemap-briefings.xml`. Each file at most 50,000 URLs or 50 MB. Generated at request time by a route handler, cached, and refreshed on revalidation.
- `lastmod` must be the real last content change (from `updated_at`), never the build time. Omit `changefreq` and `priority` (search engines ignore them).
- Include only indexable, canonical, 200 URLs. Remove `noindex` pages.
- Optional news sitemap for stories from the last two days, only if the site is accepted into Google News via Publisher Center. Confirm eligibility first.
- **robots.txt:** allow all, point to the sitemap index, disallow `/api/` and `/admin/`. Do not rely on `Disallow` to keep pages out of the index; use `noindex`.
- **AI crawlers: Decision.** Recommendation is to allow `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` and `Applebot-Extended`, because citation is the goal and our value is the data. Review each vendor's current crawler names and policies before publishing. If you later sell data, keep the CSV and API behind authentication and rate limits, and block bulk scraping at the edge.
- **`llms.txt`:** keep, updated to the new routes, with one-line descriptions, the methodology link and the corrections policy. It is a convenience and is not a ranking factor.
- **IndexNow:** submit new and changed URLs on publish (Bing, Yandex and others). Google does not use it.

## 10. Performance (Core Web Vitals)

Targets at the 75th percentile on mobile: LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.1.

- **Fonts:** self-host through `next/font` with subsetting (Latin first; add Arabic when needed). Fraunces: load only needed weights and drop unused axes. Atkinson Hyperlegible: 400 and 700 only. `font-display: swap`, preload the two fonts used above the fold, size-adjust fallbacks to avoid layout shift. Remove the current Google Fonts `@import` chain.
- **Images:** `next/image`, explicit width and height, AVIF or WebP, lazy-load below the fold, no layout shift.
- **JavaScript:** server components by default. Lazy-load the map (Leaflet), charts and chat. No analytics or widgets before first interaction unless needed.
- **Data:** one query per page, not four copies of the same query (the current homepage fires the same articles query four times).
- **Caching:** CDN cache on ISR output; `stale-while-revalidate`.
- **Budget in CI:** Lighthouse CI on home, a story, the tracker and a facility page; fail the build below Performance 85 or Accessibility 95.

## 11. Content rules for answer engines and AI citation (AEO and GEO)

These raise the chance of being quoted accurately. They do not guarantee it.

1. **Answer first.** Each story, facility and scorecard opens with a one- or two-sentence "In short" that stands alone.
2. **Facts in tables.** "At a glance" tables with units and dates: company, location, MW, stage, date.
3. **Dates everywhere.** Published, updated, and "data as of".
4. **One name per entity.** A company, place or facility has one display name and a stable URL; aliases listed on the page.
5. **Cite and show uncertainty.** Link the primary source; show "Not disclosed" instead of a guess; state confidence.
6. **Original data.** The facility tracker, history and scorecard are what others cannot supply. Give them stable URLs, a "Cite this" line and a downloadable file.
7. **Our words, not theirs.** Summaries are written in our own words with short quotes only, and the source is linked, so the page adds value and avoids copying. Keep `source_excerpt` short.
8. **Trust signals (E-E-A-T):** About page, named editorial standards, methodology, corrections log with dates, and a real contact address.
9. **Internal links with descriptive anchors:** story to facility to operator to related stories; no "click here".

## 12. International and Arabic

The audience is MENA, and English-only leaves reach on the table. Plan, not Phase 1: `/ar/` routes with `hreflang` pairs and `x-default`, right-to-left layout from the same design tokens, an Arabic-capable font subset, and professionally reviewed translation of templates and the brief. Machine-translated news pages without review risk quality problems; decide scope before starting.

## 13. Measurement

- Google Search Console and Bing Webmaster Tools verified on the final domain (domain property).
- Weekly: index coverage, pages crawled but not indexed, Core Web Vitals report, structured-data errors.
- Server or edge logs: hits by `Googlebot`, `bingbot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`; confirm they receive full HTML and 200s.
- Referrals from AI assistants (for example `chatgpt.com`, `perplexity.ai`) tracked as their own channel.
- Monthly citation test: a fixed list of about 20 target questions asked in major assistants and Google; record whether and how the site is cited.
- Event tracking for subscribe, follow and "cite this" copy.

## 14. Rollout

**Phase 0: fixes on the current app. Status: implemented in this PR.**
1. Done: hard-coded canonical, `og:url` and static JSON-LD removed from `index.html`; `Seo.tsx` is the only owner of per-page tags. Verified in a browser on the production build: one canonical, one description and one `og:image` on every page, no leftover fallback tags.
2. Done: expired `og:image` replaced by `public/og-default.png`, built from `VITE_SITE_URL`. Fallback social tags stay in `index.html` for crawlers that do not run JavaScript, marked `data-static-seo` and removed once the app loads.
3. Done: `noindex` on `/login`, `/account`, `/confirm`, `/unsubscribe`, `/admin/*` and the 404 view. `vercel.json` now lists the real routes, so unknown URLs get Vercel's real HTTP 404 with `public/404.html` instead of a 200 homepage. Preview hosts get `X-Robots-Tag: noindex` (host pattern checked against the current preview names; confirm on the next preview deploy). Limit: `/leaders/{id}` for an id that does not exist is still a 200 until Phase 1 server rendering.
4. Done: stale `public/sitemap.xml` removed from git and ignored (the build generates it); generator supports `lastmod` (people use `last_mentioned`).
5. Done: `robots.txt` disallows `/admin/`. `llms.txt` is unchanged until the new routes exist (Phase 1).
6. Not done (needs you): buy and attach the real domain, set `VITE_SITE_URL` and `SITE_URL` in Vercel and the edge-function secrets, then redirect the `.vercel.app` host.

No Supabase change is required for Phase 0. The live project's migration history matches the repo (checked read-only). The slug and `updated_at` migrations from section 4 are applied; Phase 1 can build on them.

**Phase 1: foundation (2 to 4 weeks).** Decision on framework; migrations for slugs and `updated_at`; Next.js app with shared layout, tokens and fonts; static pages, home, news index; metadata and JSON-LD helpers; sitemap index; redirects; revalidation hook.

**Phase 2: content templates (2 to 4 weeks).** Story pages, facility and operator pages, tracker, briefings, with structured data and per-page images. Indexing rules and completeness threshold in place.

**Phase 3: differentiators.** Scorecard (after verification and right of reply), `Dataset` markup and CSV, Arabic.

## 15. Acceptance tests

Run after each phase. Replace `$D` with the production domain.

```bash
# Real status codes
curl -sI "$D/this-page-does-not-exist" | head -1            # expect 404
curl -sI "$D/stats" | grep -i -E "^HTTP|^location"           # expect 301 to /data

# One canonical, one H1, content in raw HTML (no JavaScript)
curl -s "$D/news/<slug>" | grep -c 'rel="canonical"'        # expect 1
curl -s "$D/news/<slug>" | grep -c '<h1'                    # expect 1
curl -s -A "GPTBot" "$D/news/<slug>" | grep -i "In short"   # expect a match

# Structured data present and valid JSON
curl -s "$D/news/<slug>" | grep -o 'application/ld+json' | wc -l   # expect 2 or more

# Preview hosts are not indexable
curl -sI "https://<preview>.vercel.app/" | grep -i x-robots-tag   # expect noindex

# Sitemap sanity
curl -s "$D/sitemap.xml" | grep -c "<sitemap>"               # expect the files in section 9
```

Also: Rich Results Test passes for a story, a facility and the tracker; Lighthouse CI meets section 10; Search Console shows no "Duplicate, Google chose different canonical" for new pages after two weeks.

## 16. Open decisions

1. Framework (recommended: Next.js).
2. Final production domain.
3. Indexing policy for people profiles (privacy).
4. AI-crawler policy (recommended: allow).
5. Record-completeness threshold for indexing facilities.
6. Google News eligibility (Publisher Center) before building a news sitemap.
7. Arabic scope and translation process.
8. License for the facility data and any CSV (for `Dataset` markup and reuse terms).

## 17. Risks

- **Data quality.** Thin or empty facility pages will not index well and can drag down the site. The completeness threshold exists for this.
- **Naming companies.** The scorecard and any "not disclosed" comparison need verified data and a right of reply before indexing.
- **Copying sources.** Republishing source text creates duplicate-content and rights problems. Summaries stay in our words.
- **Migration risk.** Redirect every old URL; keep the old routes working until the new ones are verified.
- **No guarantees.** Rankings and AI citations depend on factors outside this spec. Measure, then adjust.
