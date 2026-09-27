# Data Center Pulse — Reliable News Ingestion Specification

**Scope:** Middle East and GCC data-center intelligence

**Policy goal:** discover quickly, publish only when the source, date, URL, and editorial evidence pass validation.

> **Fast discovery is allowed. Fast unverified publication is not.**

**How to read this document:** every rule below carries a status tag —
**✅ Enforced in code today**, **⚠️ Partially enforced**, or **❌ Not enforced yet**
(schema/plan exists, nothing writes to it). This file is the single canonical
source of truth for sourcing and publication rules. If you change code in a way
that changes a tagged status, update the tag in the same commit — an accurate
"not yet enforced" is fine; a stale "enforced" tag is what caused this document
to drift from reality once already (see git history of this file, commit
`ee3ea70`, which deleted this entire ruleset down to a two-paragraph appendix).
There is no tooling enforcing that today — this document is the agreement,
not an automated check.

## 1. Publication tiers

### Tier 1 — Primary sources — ⚠️ Partially enforced

Tier 1 sources publish information directly from the organization responsible for the announcement or decision:

- Government ministries and regulators
- Utility and energy authorities
- Company investor-relations pages
- Operator pressrooms
- Cloud-provider newsrooms
- Official project announcements
- Stock-exchange and regulatory filings
- Official tender and procurement notices
- Standards and industry bodies

Tier 1 material is labelled as an **official announcement**, not independent journalism. It may auto-publish when the URL is on an approved official domain and the content passes the date, content, and duplication checks.

**Current reality:** there is no dedicated Tier 1 feed/sitemap monitor (see §5). But `discover-news-gdelt`'s `TRUSTED` map already tags eight Tier 1 domains (`news.microsoft.com`, `aws.amazon.com`, `cloud.google.com`, `blogs.oracle.com`, `meeza.net`, `khazna.ae`, `g42.ai`, `center3.com`), and `fetch-news`'s `loadTrustedCandidates` will publish a GDELT-discovered candidate from any of them once it clears the editorial and meaning gates. So Tier 1 auto-publication is live, but only for stories GDELT happens to surface for those eight domains — not a guaranteed, complete feed of their announcements.

### Tier 2 — Established specialist and business media — ✅ Enforced

The current automatic media allowlist (`SOURCES` in `supabase/functions/fetch-news/index.ts`, mirrored in `discover-news-gdelt`'s `TRUSTED` map and the `news_sources` table):

| Source | Canonical domain | Format | Reliability score | Status |
|---|---|---|---:|---|
| Data Center Dynamics | `datacenterdynamics.com` | RSS/XML | 92 | Active |
| Data Center Knowledge | `datacenterknowledge.com` | RSS/XML | 90 | Active |
| Capacity Media | `capacitymedia.com` | RSS/XML | 88 | Active |
| The Register — data centre | `theregister.com` | Atom/XML | 86 | Active |
| Blocks & Files | `blocksandfiles.com` | RSS/XML | 82 | Active |
| ServeTheHome | `servethehome.com` | RSS/XML | 80 | Active |

`news_sources` also carries Reuters, Gulf Business, Arabian Business, MEED, and Zawya at `allowed_for_auto_publish = FALSE` — recorded for future consideration, not currently polled.

Tier 2 stories are labelled as **reported by specialist media**. They are not treated as proof of capacity, investment value, project completion, or official policy unless corroborated (§7 — not yet enforced).

### Discovery-only sources — ✅ Enforced by allowlist, ❌ no explicit blocklist

The following may identify candidate URLs but cannot publish directly:

- GDELT
- Google News RSS
- NewsAPI
- Firecrawl search
- Social media — LinkedIn, X/Twitter, Facebook, Instagram, Reddit, YouTube
- PRNewswire, GlobeNewswire, OpenPR
- Biztoc and other aggregators
- General blogs without a clear editorial standard

A discovery candidate can become publishable only after the final article URL resolves to an approved Tier 1 or Tier 2 domain and passes the normal validation pipeline. **This is currently true by construction** — `fetch-news` only publishes a `news_candidates` row when `source_tier` is non-null, and `source_tier` is only set by `discover-news-gdelt`'s `TRUSTED` map — so an unlisted domain can never auto-publish. There is no separate explicit blocklist check; none is needed as long as `loadTrustedCandidates` keeps filtering on `source_tier IS NOT NULL`. If that filter is ever loosened, this list becomes load-bearing again.

## 2. Current XML/RSS/Atom source catalog — ✅ Enforced

The automatic engine currently polls these XML feeds:

```text
https://www.datacenterdynamics.com/en/rss/
https://www.datacenterknowledge.com/rss.xml
https://www.capacitymedia.com/feed
https://blocksandfiles.com/feed/
https://www.servethehome.com/feed/
https://www.theregister.com/data_centre/headlines.atom
```

The `news_sources` table stores the source name, canonical domain, feed URL, tier, source type, reliability score, active status, and feed-health columns (`last_checked_at`, `last_http_status`, `last_feed_error`).

### Source health requirements — ❌ Not enforced

`news_sources` has the columns to record, per feed run: HTTP status, XML/RSS/Atom detection result, and error message on failure. **Nothing currently writes to them.** `fetchSource` in `fetch-news` only `console.error`s a failure and returns an empty array for that source — there is no persisted feed-health record, so a source silently broken for weeks looks identical, from the database, to one that's simply had no news. A feed failure does not cause untrusted stories to enter the feed (that part holds), but it also isn't visible without reading Edge Function logs.

## 3. XML and Atom parsing rules — ✅ Enforced

The parser (`parseItems` in `fetch-news`) supports both RSS 2.0 and Atom.

### RSS fields

| RSS/XML field | Database field | Rule |
|---|---|---|
| `item/title` | `title` | Required; minimum meaningful length (12 chars) |
| `item/link` | `source_url` | Required; must be HTTP/HTTPS |
| `item/guid` | fallback URL | Used only when `link` is absent and it is a valid URL |
| `item/description` | `summary` | HTML stripped, entities decoded, capped at 700 chars |
| `item/pubDate` | `original_published_at` | Required; must parse to a valid timestamp |

### Atom fields

| Atom/XML field | Database field | Rule |
|---|---|---|
| `entry/title` | `title` | Required |
| `entry/link href="..."` | `source_url` | Required |
| `entry/summary` or `entry/content` | `summary` | Stripped, capped at 700 chars |
| `entry/published` | `original_published_at` | Preferred publication date |
| `entry/updated` | date fallback | Used only if `published` is absent |

### XML safety rules — ✅ Enforced

- Accept only responses matching `/<(?:rss|feed|channel)/i` (rejects HTML error pages returned with HTTP 200).
- Reject missing or invalid article URLs.
- Reject missing publication dates.
- Reject malformed dates (`Number.isNaN(date.getTime())`) rather than substituting ingestion time.
- Reject source URLs whose hostname doesn't match the allowlisted domain (or a subdomain of it).
- Deduplicate by `source_url` via a `Map` keyed on that field.
- Limit to the first 15 items per feed per run.
- Reject items older than 14 days or dated more than 1 day in the future.

**Not implemented from the original plan:** canonical-URL tracking-parameter stripping, and title-hash deduplication (only exact `source_url` dedup exists — two URLs for the same story with different query strings would both pass).

## 4. Fast discovery: GDELT — ✅ Enforced

`discover-news-gdelt` runs every 30 minutes and queries the free GDELT DOC API with four queries tuned for GCC/Middle East data-center topics (see `QUERIES` in `supabase/functions/discover-news-gdelt/index.ts`). It stores results in `public.news_candidates` and never publishes directly — publication is entirely `fetch-news`'s job.

Each candidate stores: discovery source, discovered URL, canonical URL, title and summary, source domain, source tier/type/reliability when the domain is recognized (null otherwise), publication timestamp, the raw discovery payload, and candidate status.

GDELT is not treated as the source of truth. It identifies coverage; the original article's own domain (checked against the Tier 1/2 allowlist) remains the evidence gate.

## 5. Official primary-source monitoring — ❌ Not implemented (roadmap)

The next Tier 1 expansion should monitor official announcement pages and XML sitemaps directly, rather than relying on GDELT to happen to surface them (§1). Candidates for direct monitoring:

**Cloud and technology providers:** Microsoft News Center EMEA/Middle East, AWS News regional announcements, Google Cloud News, Oracle Cloud announcements.

**Middle East operators and ecosystem companies:** Khazna, G42, e&, stc / Center3, Gulf Data Hub, MEEZA, DataVolt, Moro Hub, Injazat / Core42, plus regional announcements from Equinix, Digital Realty, NTT, Gulf Bridge International.

**Government, policy, and infrastructure bodies:** Saudi MCIT and related digital-infrastructure authorities; UAE digital-government and energy authorities; Qatar, Bahrain, Kuwait, and Oman digital-infrastructure authorities; economic-development agencies; utilities and renewable-energy authorities; official tender/procurement portals.

Preferred monitoring order once built: (1) official RSS/Atom feed, (2) XML sitemap filtered for news/press-release URLs, (3) official news archive with metadata, (4) JSON-LD `NewsArticle`/`Article` metadata, (5) manual review if none exists.

An official company announcement is primary evidence for what the company announced — it is not independent verification of every commercial claim inside it.

## 6. Validation pipeline — ✅ Enforced except step 12

```text
1.  Fetch trusted RSS/Atom feeds in parallel                          ✅
2.  Load trusted (non-null-tier) news_candidates                      ✅
3.  Merge and deduplicate by source_url                                ✅
4.  Validate canonical URL and source-domain match                    ✅
5.  Validate publication date (real, within 14 days)                  ✅
6.  Reject future-dated or stale items                                 ✅
7.  Normalize title and text                                           ✅
8.  Run strict AI editorial quality gate (score ≥ 7/10)                ✅
9.  Run AI meaning/impact/entity extraction                            ✅
10. Compute confidence score                                           ✅
11. Store provenance and validation fields                             ✅
12. Require corroboration for high-impact claims                       ❌ (§7)
13. Publish, mark source news_candidates row published/rejected        ✅
14. Expire stale (14-day+) undecided candidates                        ✅
```

### Automatic publication requirements — ✅ Enforced

All of the following are required: approved source policy; valid canonical URL; correct source-domain match; real, recent publication date; meaningful title (≥ 12 chars); no exact-URL duplicate; editorial quality score ≥ 7/10; meaning extraction returns a summary, meaning statement, and source excerpt. If any step fails, the item is not published.

## 7. High-impact claim rules — ❌ Not enforced

The following claim types should require Tier 1 evidence or corroboration by two independent Tier 2 sources before being treated as verified fact, per the site's public promise (see `docs/news-source-research-20260927.md` and the "Human review rule" this document used to state):

- MW capacity · Investment amount · Facility opening/operational date · Land acquisition
- Government policy or regulation · Cloud-region availability · Construction status
- Acquisition or ownership change · Executive appointment · Customer/contract claim
- Energy, water, or sustainability performance claim

**Current reality:** `articles.corroboration_count`, `articles.corroboration_urls`, and `articles.primary_source_count` exist as columns. Every insert in `fetch-news` sets `corroboration_count: 0` and `corroboration_urls: []` unconditionally, and nothing ever updates them afterward. `claim_type` (project/investment/policy/capacity/leadership/technology/operations/market/other) is already extracted per article by `generateMeaning` — the classification needed to know *which* articles require corroboration already exists in the data; the corroboration check itself does not. This is the highest-priority gap in the pipeline: the site's stated policy and the code are currently out of sync on this point.

An article on a high-impact claim type may still publish as a clearly attributed report ("Company X announced…") without corroboration — attribution, not deletion, is the interim safeguard. Never rewrite a company announcement into an unattributed fact.

## 8. Database provenance fields

Three separate status columns exist; do not conflate them.

**`articles.publication_status`** — `published | pending_review | rejected | archived`. Only `published` rows are shown by `useArticles` (`.eq("publication_status", "published")`). `pending_review` and `rejected` are defined by the CHECK constraint but nothing in the current pipeline ever inserts a row with either — every article that reaches the insert step is inserted as `published`. `archived` is used by legacy-data migrations, not the live pipeline.

**`articles.validation_status`** — `validated_primary | validated_specialist | needs_corroboration | pending_review | rejected | legacy_unvalidated`. Set by the editorial gate to `validated_primary` (Tier 1) or `validated_specialist` (Tier 2). `needs_corroboration` is defined but never set — it's the value §7's future corroboration check should apply to high-impact claims that lack a second source.

**`news_candidates.candidate_status`** — `discovered | approved | published | pending_review | rejected | expired`. `approved` and `pending_review` are defined but unused; the live pipeline only ever transitions `discovered → published | rejected | expired`.

Every published article stores: `source`, `source_url`, `source_domain`, `source_tier`, `source_type`, `source_reliability_score`, `is_primary_source`, `publication_status`, `validation_status`, `validation_score`, `corroboration_count`, `original_published_at`, `validated_at`, `validation_notes`, plus the meaning-pipeline fields `meaning`, `impact_summary`, `claim_type`, `named_entities`, `importance_score`, `confidence_score`.

## 9. Failure behavior — ✅ Enforced

The pipeline fails closed:

- Missing `GEMINI_API_KEY` → the whole run throws before fetching anything; zero items published.
- Invalid AI output (quality gate or meaning pass) → the whole run throws; zero items published from that run.
- Broken/non-XML feed response → that source is skipped (logged, not persisted — see §2), other sources unaffected.
- Invalid or missing date, unrecognized domain, missing title, missing link → the individual item is dropped in `parseItems`, not the run.
- Duplicate `source_url` (already published) → skipped, and if it came from a candidate, that candidate is marked `published` pointing at the existing article (so it isn't reconsidered forever).

No failure mode results in "publish everything anyway."

## 10. Speed design

- GDELT discovery: every 30 minutes (`discover-news-gdelt-every-30m`). ✅
- Publication gate: every 2 hours (`fetch-news-every-2h`). Feeds are fetched live inside that same 2-hour run, not on their own faster schedule — the "run direct trusted feeds every 30–60 minutes" idea from the original plan was superseded by using GDELT as the fast layer and keeping `fetch-news` as the single, slower, authoritative gate.
- Discovery and publication are intentionally separate processes, so GDELT (or any future discovery source) can never bypass the trusted-source policy by publishing directly.

## 11. Sources explicitly excluded from auto-publication

Not reliable enough to publish directly, regardless of what GDELT or any future discovery layer surfaces: social posts, search-result snippets, NewsAPI free-plan results, GDELT results without original-source validation, Firecrawl search results without original-source validation, press-release distribution pages (PRNewswire, GlobeNewswire, OpenPR) treated as independent reporting, aggregator pages, unattributed blogs, AI-generated summaries without source evidence.

These are excluded today as a consequence of the allowlist (§1), not by an explicit denylist check — see the note in §1.

## 12. Editorial labels — ❌ Not implemented in the frontend

The evidence-level labels below describe the intended reader-facing distinction between an official announcement, specialist-media reporting, and a corroborated claim:

- **Official announcement** · **Reported by specialist media** · **Independent corroboration** · **Company-reported figure** · **Requires corroboration** · **Editorially reviewed**

**Current reality:** `NewsCard.tsx` renders category, sentiment badge, and a "Why it matters" insight line, but no tier/source-type/corroboration badge — a Tier 1 primary announcement and a Tier 2 specialist-media report look identical to a reader today, even though `source_tier`/`source_type`/`validation_status` are already stored on every article. This is a real, currently-missing feature, not a completed one — `article.people` in the same component has the same problem (rendering code exists, waiting for `useArticles` to actually join and populate `people`, which it does not).

Never display a company press release as independent journalism once these labels exist.

## 13. Operating checklist for adding a source

Before activating a new source, confirm: canonical domain; ownership and publisher identity; editorial or correction policy; feed or sitemap reliability; publication-date quality; relevance to data centers or regional infrastructure; whether it is primary, specialist, business media, press-release, or aggregation; whether its content may be reused or only linked to; whether rate limits permit the desired polling frequency; whether the source should auto-publish or require review.

Record the result in `public.news_sources` before adding the source to `SOURCES` in `fetch-news` (and, if it should also feed discovery, to the `TRUSTED` map in `discover-news-gdelt`) — the registry table and the code arrays are not automatically kept in sync with each other; update both.

## 14. Roadmap status

Priority is ranked by three criteria: does it compound (more value per article over time, not just once), is the AI's job narrow and checkable (low hallucination/liability exposure), and does it connect to something already built rather than needing new infrastructure. Items without a priority number are acknowledged, real gaps, but not queued next.

| # | Item | Status | Priority |
|---|---|---|---|
| 1 | `news_candidates` table for discovery results | ✅ Done | — |
| 2 | GDELT discovery Edge Function that never publishes directly | ✅ Done | — |
| 8 | Candidate lifecycle terminal states (`rejected`/`expired`, not stuck at `discovered` forever) | ✅ Done (added 2026-09-27) | — |
| 9 | People/company/place entity separation, and writing mentions into the `people` table `/leaders` reads | ❌ Not started | **P1** — compounds via SEO (each person = an indexed `/leaders/:id` page, already in the sitemap), narrow/checkable AI task (name-in-article, not a fact claim), and plugs directly into already-built but unused revenue infrastructure (Stripe premium, `profile_claims` claim flow) |
| 7 | Verification/corroboration of data-center claims — high-impact facts (capacity, investment, project status, policy, leadership) require a primary source or two independent Tier 2 sources before being treated as confirmed | ❌ Not started (§7) | **P1** — this is the site's own public promise and is currently unenforced; ties for top priority with #9, not because it drives growth but because shipping #9's higher visibility without also shipping this widens the gap between what the site claims and what it checks |
| 3 | Official-source sitemap monitors for top operators/government bodies | ❌ Not started (§5) | Roadmap |
| 4 | Primary-source validation labels in the frontend | ❌ Not started (§12) | Roadmap |
| 5 | Human review queue for high-impact claims | ❌ Not started — `pending_review` statuses exist on all three status columns but nothing ever sets them | Roadmap |
| 6 | Feed-health metrics and alerts for broken XML sources | ❌ Not started (§2) | Roadmap |
| 10 | Technology-direction trend signal (cross-article, not per-article) | ❌ Not started | Roadmap — deprioritized versus #7/#9: it's linear, one-sided content rather than a compounding loop, and the AI's job (calling an industry trend) is more subjective and error-prone than either naming a person or checking a claim against a second source |

**Next up, in this order:** #9 (people/leaders), then #7 (verification/corroboration). Neither is being built yet — this table records the agreed priority, not a build in progress.

## Final rule

Data Center Pulse should be fast because it discovers early, not because it publishes first without evidence.

The correct product promise is:

> **Early signals, clearly sourced, professionally validated.**
