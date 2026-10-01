# Data Center Pulse — Website Audit, Rebuild Prompt, Keep/Remove List

Audited from source (every route in `src/App.tsx`, every component they render, forms, hooks, SEO files). Nothing was run in a browser, so visual/perf findings are from code, not screenshots.

## Status update (2026-10-01)

What the audit found, and where it stands after SEO Phase 0 and the first database changes (this PR).

| Finding | Status |
|---|---|
| Duplicate canonical and `og:url` tags on every non-home page | **Fixed.** One owner (`Seo.tsx`); verified one canonical per page in a browser on the production build |
| Expired `og:image` | **Fixed.** Hosted `public/og-default.png`, built from `VITE_SITE_URL` |
| Unknown URLs return 200 with the homepage title | **Mostly fixed.** Real 404 for unknown paths. A non-existent `/leaders/{id}` is still a 200 until server rendering (Phase 1) |
| Login, account, confirm, unsubscribe, admin and 404 indexable | **Fixed.** `noindex` |
| Preview URLs indexable as duplicates | **Fixed in config** (`X-Robots-Tag` on preview hosts); confirm on the next preview deploy |
| Stale committed `sitemap.xml` | **Fixed.** Removed from git; generator adds `lastmod` |
| Homepage shows "0+ subscribers" | **Fixed.** Count-only database function applied. The real count is 0 confirmed, so the line is hidden until it reaches 100 (`MIN_PUBLIC_SUBSCRIBERS`) |
| No `slug` or honest `updated_at`, so no stable article/facility/person URLs | **Done in the database.** Slugs backfilled and unique for 1,921 articles, 111 facilities, 362 people; `updated_at` only moves on content changes; redirect-history table added. No page uses them yet (Phase 1) |
| Generated Supabase types out of date | **Fixed.** Regenerated from the live schema |
| Client-rendered SPA; content needs JavaScript | **Open.** Phase 1 (framework decision) |
| No per-article pages; every card links out | **Open.** Phase 1 and 2 |
| Hard-coded "5,000+ professionals" in the subscribe bar | **Fixed.** Replaced with plain wording, no number |
| "3 sources · updated every 2 hours" on the homepage; "Exclusive Job Board Access" in the subscribe dialog | **Fixed.** Both removed |
| Contrast failures (axe), 11 px text, mobile chat panel clipped, sideways scroll on `/stats` and `/leaders` | **Open** (design rebuild) |
| No Privacy, Terms, About/methodology, Contact pages | **Built.** Pages, shared footer and routes are in. Privacy, Terms and Contact stay `noindex` until `VITE_LEGAL_NAME`, `VITE_CONTACT_EMAIL` and `VITE_GOVERNING_LAW` are set. Needs a lawyer's review before launch |
| Pricing says "Contact us" but the button starts checkout | **Fixed.** Checkout is off by default: price shows "By request" and the button is "Request access" (links to Contact). Setting `VITE_PREMIUM_CHECKOUT=true` and `VITE_PREMIUM_PRICE` (after Stripe is configured) switches on the real upgrade flow. "Priority support" removed |
| Seven separate email capture points | **Open** (design rebuild) |
| Unsubscribe fires on page load | **Open** |
| Real production domain | **Open.** Needs you |

Other findings from the database check (not caused by this work): three `SECURITY DEFINER` views (`market_signals_public`, `regional_outlook_public`, `strategic_insights_public`) and Supabase leaked-password protection off. Both are worth a separate review.

## 0. Rendered pass (added after the source audit)

Method: headless Chromium against production (`data-center-insights-fawn.vercel.app`), 10 routes × 375px and 1440px, axe-core (WCAG 2.2 AA), network capture, screenshots. Forms were **not** submitted (would send real emails). Lighthouse was not run.

**Confirmed by rendering**
- Homepage subscriber claim renders **"0+ MENA infrastructure leaders subscribed"** (RLS blocks the anon count).
- Every route has **serious colour-contrast failures** (axe): homepage 87 nodes desktop / 40 mobile, `/insights` 33, `/stats` 18, `/leaders` 11. `/stats` also has **critical `select-name`** (2 unlabeled selects) and **16 `svg-img-alt`** failures.
- **Tiny text:** 141 of 257 text elements on the homepage and 484 of 638 on `/stats` are under 12px.
- **Mobile chat panel is clipped off the left edge** (x = −29px at 375px wide). The chat button, the 48px subscribe bar and two 2px progress bars are all fixed-position; the subscribe bar covers content and the bar's "Work email" placeholder is barely legible.
- **Horizontal scroll on mobile:** `/stats` (378px > 375) and `/leaders` (440px > 375, the table).
- **Pulse Index renders twice on desktop home** (snapshot row and sidebar). Mobile home is 6,280px tall.
- **"Live Market Signals" shows grey skeleton bars permanently** when there are no signals (empty array is treated as loading).
- Home fires the same `articles` query **4 times** plus 9 other requests; `/insights` fires it twice.
- Stats map: many facilities show `Capacity n/d` and `UNKNOWN` lifecycle (e.g. AWS Bahrain sites), 66 of 111 have coordinates. The stat tiles are grey slate with dark text, which fails contrast.

**New issues found only by rendering**
- **Duplicate canonical and og:url on every non-home page.** `index.html` hard-codes canonical `/` and Helmet adds a second one (`/stats` has both). Conflicting canonicals can make Google consolidate pages to the homepage.
- **og:image is an expired signed URL** (Google Cloud link, expired 2026-02-21). Social previews are broken.
- **404s return HTTP 200** with the homepage `<title>` and canonical (soft 404).
- Home "Latest stories loaded" shows 13 while the platform card says 1,919 indexed, and the feed has only 6 visible cards. The 13 vs 1,919 gap is unexplained (recency filter?) and worth checking.

**Corrections to the source-only findings below**
- The **sitemap domain mismatch is not a live bug.** The committed `public/sitemap.xml` is stale, but `prebuild` regenerates it and the deployed sitemap is correct (369 URLs, right domain). Downgrade to housekeeping: delete the stale committed file.
- **Fake fallback tickers/events are not firing in production.** Market Pulse and Upcoming Events show real rows. The fallback code is still a risk if the tables empty out, but it is not live today.
- The "Job Board", "5,000+", "3 sources" and "Priority support" claims still stand (they are text in the page).

**Not verified:** Lighthouse/bundle weight, form submissions, unsubscribe-on-load behaviour, premium-gated views (needs a signed-in premium user), admin pages.

## 1. What the site is

A Vite + React + Supabase SPA: an AI-curated MENA data-center news feed with a daily digest, a people directory, a stats/map dashboard, and a freemium "intelligence" tier. Stack is fine. The problem is not technology, it is **focus**: the product has six different personalities (news site, newsletter landing page, market-data terminal, people CRM, SaaS paywall, AI chatbot) and each page pushes a different one.

## 2. Page-by-page audit

| Route | What it does | Verdict |
|---|---|---|
| `/` Index | Hero + digest + 3-col "snapshot" + filtered feed + sidebar + footer + subscribe bar + chatbot | **Rework.** Too many stacked modules before the feed. See §3 |
| `/stats` | Map, capacity charts, provider charts, CapEx trend | **Keep, but split real from illustrative.** Footer admits "Illustrative estimates, not yet independently verified". Fake numbers on a data-credibility product is the biggest trust risk on the site |
| `/intelligence` | Pulse Index (free) + Market Signals & Regional Outlook (premium gate) | **Keep as the paid-product page.** Fine structurally |
| `/insights` | Editor's Picks, Strategic Read, keyword cloud | **Merge into `/intelligence`** or the homepage. Overlaps heavily; "Insights" vs "Intelligence" is indistinguishable to a visitor |
| `/leaders` | Searchable people table, region tabs, role chips, curated lists | **Keep.** Best differentiator. Curated-list cards are not clickable (dead UI). Role filter is substring match on title ("VP", "CTO") — will miss/mis-hit |
| `/leaders/:id` | Profile, mentions, claim button, verification badge | **Keep.** Good SEO surface. "Claim profile" is a one-click insert with no proof step shown |
| `/archive` | Past 30 digests in `<details>` | **Keep, but fold into the digest.** Uses its own bare header instead of shared `Header`; no ticker/subscribe. Inconsistent |
| `/pricing` | Free vs Premium | **Fix.** Premium price says "Contact us" yet the button starts a Stripe checkout. Pick one. "Priority support" on a solo-run product is an unbacked promise |
| `/login` | Magic-link email | **Keep.** Clean. No header/footer, fine |
| `/account` | Email, plan, sign out | **Keep, extend.** No manage-billing, no newsletter prefs, no saved articles |
| `/confirm`, `/unsubscribe` | Token pages hitting edge functions | **Keep.** Must exist for compliance. Unsubscribe fires on page load (GET with side effect): email scanners can unsubscribe people. Use a confirm button |
| `/admin/claims`, `/admin/people-verification` | Admin queues | **Keep, but unlink/hide.** Two admin pages with duplicated `is-admin` checks; move under one `/admin` shell |
| `*` NotFound | Bare 404, uses `bg-muted`, raw `<a>` | **Restyle** with Header + search + popular links |

## 3. Form-by-form audit

There are **seven subscribe/email capture points** feeding one endpoint. That is the core UX problem.

| Form | Where | Issue |
|---|---|---|
| Header subscribe dialog | Every page with `Header` | Promises "Exclusive Job Board Access" — **no job board exists** |
| Bottom subscribe bar | `/`, `/insights`, `/intelligence` | Auto-appears after 5s + scroll, auto-minimizes at 8s, says "Join **5,000+** professionals" — hard-coded, unverifiable. Overlaps chatbot button (both fixed bottom-right). `text-muted-foreground` on dark blue bar fails contrast |
| Newsletter modal | `Index.tsx` | **Dead code.** `setShowModal(true)` is never called anywhere. Delete |
| Login email | `/login` | Fine. Add rate-limit message and "wrong email?" back action |
| Chatbot input | Floating, 3 pages | Calls `news-chat` edge function with the public key; no rate limit visible client-side; fixed 380px width **overflows phones**; no disclaimer that answers are AI-generated |
| Leaders search + filters | `/leaders` | No debounce issue at 200 rows, but hard `limit(200)` means search silently misses anyone past #200 |
| Claim profile | `/leaders/:id` | No evidence/notes field; admin has nothing to judge on except email domain |
| Admin approve/reject | admin pages | No confirmation, no undo |

Form-wide issues: no inline validation beyond `type="email"`; no consent/privacy text or link anywhere (there is **no Privacy Policy, Terms, or Contact page**, which is a legal gap for an EU/UAE newsletter and a Stripe requirement); no honeypot/CAPTCHA on subscribe; success state differs on each form (toast vs inline vs bar).

## 4. Cross-cutting problems

1. **Fake / hard-coded numbers presented as live.** "5,000+ professionals", "3 sources · updated every 2 hours", Sidebar fallback tickers (EQIX $845.20 etc.) shown when the DB is empty, Stats illustrative charts, Header `tickerHeadlines` array (unused but contains "BREAKING: Blackstone closes $10B" invented headlines), `data/mockData.ts`. Per your own standard (no number without a source) these must go or be visibly labelled.
2. **Subscriber count likely broken.** `Index.tsx` counts `subscribers` with the anon key, but the current RLS only lets users see their own row, so the count returns 0 → the page shows "**0+** MENA infrastructure leaders subscribed". Expose a count via a server-side view/RPC, or drop the claim.
3. **(Downgraded, see §0) Committed sitemap is stale.** `public/sitemap.xml` lists `pulsefeed-chronicle.lovable.app`; `robots.txt` and `Seo.tsx` use `data-center-insights-fawn.vercel.app`. Google will ignore/penalize mismatched URLs. Also `Seo.tsx` itself says "update once the production domain is purchased" — buy a domain first, then fix everything once.
4. **Every card is an external link.** News cards, hero, ticker, trending: all `target="_blank"` to the source. Nothing keeps users on-site, so no article pages exist to rank in search. Only `/leaders/:id` is indexable long-tail content.
5. **Homepage density.** Above the feed: progress bar ×2 (Header loading bar + reading-progress bar, both fixed top), ticker, hero, digest, 3-column snapshot — then the feed. The sidebar repeats the same data again (Pulse index appears on the homepage **twice**, trending repeats hero).
6. **Design-system drift.** Three Google Fonts imported (Inter twice, Lora, Space Mono) but only Inter is visibly used; 49 shadcn `ui/` files exist and only ~12 are imported. `--muted-foreground` equals `--foreground` in light theme (hierarchy collapses); `--accent` is near-white, yet code uses `text-accent` for "positive/green" states (invisible on light theme). Magic colours like `hsl(213,52%,25%)` and `hsl(35,92%,60%)` bypass tokens. Light theme defined, but toggled by a `.light` class with default dark: inconsistent.
7. **Navigation.** "Global News / Middle East Focus / Sustainability" are not pages, they are filters that fire a window `CustomEvent` and a `setTimeout(300)` hack. Active state is local `useState`, so it is wrong on load and after route change. Seven top-level items; the bar is the same on every page but the footer is different on every page (Index, Insights, Leaders, Profile each hand-rolled; Archive, Stats, Pricing, Account have none or different).
8. **Accessibility.** Clickable `div`s (events), icon-only buttons missing labels (chatbot close, bookmark states), `<a href="#">` for missing URLs, 10–11px text for primary metadata, low contrast on the subscribe bar, marquee ticker has no pause (WCAG 2.2.2), no skip link, no `prefers-reduced-motion` handling, h1 on `/` is the featured article title (changes daily, breaks page identity).
9. **Performance.** Hero calls `useArticles` twice (5 and 50) and Index a third time (50); Stats fetches ~45 columns of every data center client-side; map + recharts + react-markdown + leaflet all in the main bundle (no route-level `lazy()`).
10. **Trust/credibility gaps.** No About, no methodology (how is news selected, how are "Pulse Index" and "confidence" computed), no source list, no corrections policy, no contact. For an intelligence product selling to investors this is the conversion blocker, not the UI.

## 5. KEEP

- Stack (Vite/React/Tailwind/shadcn/Supabase/Vercel) and the data pipeline behind it
- Daily AI digest + archive (your strongest daily-habit feature)
- Leaders directory, profiles, verification badges, claim flow (unique; add evidence step)
- Stats map + source-backed capacity charts (the `DataSourceTag live` idea is good: extend it everywhere)
- Pulse Index, Market Signals, Regional Outlook, `ConfidenceBadge` (premium core)
- Magic-link login, double-opt-in subscribe, confirm/unsubscribe edge functions
- "Why it matters" insight line and sentiment badge on cards (real differentiation over aggregators)
- Skeleton loading states, SEO component with JSON-LD, theme toggle
- Brand name and the MENA-first positioning

## 6. REMOVE

- Newsletter modal block in `Index.tsx` (unreachable)
- `MarketGlance.tsx`, `NavLink.tsx`, `data/mockData.ts`, `tickerHeadlines` array in `Header.tsx` (unused)
- Sidebar **fallback tickers and fallback events** (fake data) — show empty state instead
- "5,000+ professionals", "3 sources", "Exclusive Job Board Access", "Priority support" until true
- Second progress bar (keep one)
- Bottom subscribe bar **or** header dialog **or** inline form: keep one persistent + one inline (see §7)
- `/insights` as a separate route (merge)
- Duplicate Pulse Index widget on homepage
- Unused shadcn files (~35) and the extra font imports
- Stats "illustrative" charts unless labelled as estimates with a named source; otherwise delete CapEx trend and donut charts
- `debug-people-extract` edge function (name says it all; don't ship debug endpoints)
- `database_export.sql` from the repo root (data dump in source control) and `.lovable/plan.md` / Lovable boilerplate README

## 7. Recommended structure

**Site map (8 public pages, down from 14):**

```
/                 Home: brief + feed
/news             Full feed with real filters (region, topic, sentiment), URL-driven (?region=middle-east)
/news/:slug       On-site article page: summary, insight, people, source link (this is what search indexes)
/intelligence     Pulse Index, signals, outlook (free teaser + premium)
/data             Map + capacity dashboard (renamed from /stats), source-tagged
/leaders, /leaders/:id
/briefings        Archive (renamed), each brief gets its own URL
/pricing, /about  (about = methodology, sources, contact, corrections)
/login /account   auth
/privacy /terms   legal
/admin/*          one shell, noindex, not in nav
```

**Nav (5 items):** News · Intelligence · Data · Leaders · Briefings. Right side: theme, Sign in, **one** Subscribe button. Filters live on `/news` as real URLs, not custom events.

**Homepage order:**
1. Masthead + date + one thin "Latest" ticker (pausable)
2. Lead story + 4 secondary (hero), each linking to `/news/:slug`
3. Today's brief (collapsed to 5 bullets, "Read full brief")
4. Feed with filter chips + right rail: Pulse Index (once), Key people, Events
5. Inline subscribe block (single form, with consent line)
6. Shared footer: About, Methodology, Privacy, Terms, Contact, Unsubscribe help

**Subscribe consolidation:** one `<SubscribeForm />` component (email + optional role dropdown, honeypot, consent text) used in: header dialog, homepage inline block, end of each article/brief. Kill the auto-popping bar. Same success/"check your email" state everywhere.

**Design system cleanup:** fix tokens so `--muted-foreground` ≠ `--foreground`; define real `--success`, `--warning`, `--danger`; one sans (Inter) + optionally one serif (Lora) for article headlines; minimum 12px body metadata; one shared `<PageShell>` (Header, Footer, Seo) so footer/header drift cannot recur; route-level `lazy()` for Stats/Map/Leaders.

**Trust layer:** an `/about` page with methodology (sources, how the Pulse Index is computed, what "confidence" means, what is AI-generated), a corrections email, and a "data as of" timestamp on every metric.

## 8. Prompt to hand to a designer / AI builder

> Redesign **Data Center Pulse**, a MENA-first data-center news and market-intelligence site for operators, investors and recruiters in infrastructure (Dubai/GCC focus, global context). Keep the existing stack: Vite, React, TypeScript, Tailwind, shadcn/ui, Supabase, Vercel. Keep all existing data sources and edge functions.
>
> **Goal:** a credible, fast, editorial-grade intelligence site that converts readers to a free daily briefing, and a minority to a paid Premium tier. Tone: Bloomberg/The Information, not crypto dashboard. Dark and light themes, both fully legible.
>
> **Information architecture:** Home, News (filterable via URL params), Article pages (`/news/:slug`, indexable), Intelligence (Pulse Index, Market Signals, Regional Outlook: free teaser, premium full), Data (GCC data-center map and capacity charts), Leaders (directory + profiles, claim flow), Briefings (archive, one URL per day), Pricing, About/Methodology, Privacy, Terms, Login, Account. Admin pages are separate, noindex, behind an admin check, not linked in nav.
>
> **Navigation:** five items only (News, Intelligence, Data, Leaders, Briefings), one Subscribe button, theme toggle, account icon. Mobile: sheet menu. Active state derived from the route.
>
> **Homepage:** thin pausable ticker → lead story with four secondary → collapsed "Today's brief" → filterable feed with a right rail (Pulse Index once, key people, events) → single inline subscribe block → full shared footer. No popups, no auto-appearing bars, no duplicate modules.
>
> **Forms:** one reusable SubscribeForm (email, optional role select, honeypot, consent line linking to Privacy) with identical success state ("Check your email to confirm") wherever used. Login is magic-link. Claim-profile form needs a short evidence field (LinkedIn/company URL). Admin approve/reject need confirmation. All forms: inline validation, disabled-while-submitting, accessible labels, error text tied via `aria-describedby`.
>
> **Data integrity rules (non-negotiable):** never render a number without a source or timestamp; no hard-coded fallback data; any estimate is visibly tagged "Estimate" with its source; empty states say "No data yet" instead of placeholders. Subscriber and article counts come from server-side aggregates, hidden if unavailable.
>
> **Design system:** define tokens for background/surface/border/text-primary/text-secondary/primary/success/warning/danger in both themes, meeting WCAG AA. Inter for UI, optional serif for headlines. Minimum 12px for any text users need to read. 4px radius, 1px borders, sparing shadow. Respect `prefers-reduced-motion`; marquee must be pausable.
>
> **Performance and SEO:** lazy-load route bundles and map/chart libraries; one shared article query via React Query; correct canonical domain, sitemap generated for that domain including leader and article URLs; JSON-LD (NewsArticle, Person, Organization, Dataset); OG images per article.
>
> **Deliverable:** component-level plan first (PageShell, SubscribeForm, ArticleCard, MetricCard with DataSourceTag, PremiumGate), then implementation in small PRs: (1) tokens + shell + footer, (2) nav + routes, (3) subscribe consolidation, (4) homepage, (5) article pages, (6) data/Stats cleanup, (7) legal/about pages.

## 9. Fix order (highest return first)

1. Remove fake numbers and fallback data; fix subscriber-count claim
2. Fix sitemap/domain mismatch; decide the real domain
3. Add Privacy, Terms, About/Methodology, Contact
4. Consolidate the seven email captures into one component; delete dead modal
5. Shared `PageShell` with header + footer on every page; fix nav to use real routes
6. Pricing: decide paid vs "contact us" and make the button match; remove unbacked features
7. Unsubscribe: confirm button instead of GET-on-load
8. Token/contrast fixes; chatbot mobile width
9. Merge `/insights` into `/intelligence`; route-level code splitting
10. On-site article pages (largest SEO upside, largest build)

## 10. Things I could not verify

- Live rendering, Lighthouse scores, real mobile behavior (audit is source-only)
- Whether the DB actually has the rows the UI expects (empty DB would trigger the fake fallbacks in production)
- Whether `subscribers` RLS was changed after the migration I read; confirm with a quick anon query
- `vercel.json` exists; I did not check that it has the SPA rewrite for deep links such as `/leaders/:id`
