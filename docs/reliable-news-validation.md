# Data Center Pulse — Reliable News Ingestion Specification

**Scope:** Middle East and GCC data-center intelligence

**Policy goal:** discover quickly, publish only when the source, date, URL, and editorial evidence pass validation.

> **Fast discovery is allowed. Fast unverified publication is not.**

## 1. Publication tiers

### Tier 1 — Primary sources

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

### Tier 2 — Established specialist and business media

The current automatic media allowlist is:

| Source | Canonical domain | Format | Reliability score | Status |
|---|---|---|---:|---|
| Data Center Dynamics | `datacenterdynamics.com` | RSS/XML | 92 | Active |
| Data Center Knowledge | `datacenterknowledge.com` | RSS/XML | 90 | Active |
| Capacity Media | `capacitymedia.com` | RSS/XML | 88 | Active |
| The Register — data centre | `theregister.com` | Atom/XML | 86 | Active |
| Blocks & Files | `blocksandfiles.com` | RSS/XML | 82 | Active |
| ServeTheHome | `servethehome.com` | RSS/XML | 80 | Active |

Tier 2 stories are labelled as **reported by specialist media**. They are not treated as proof of capacity, investment value, project completion, or official policy unless corroborated.

### Discovery-only sources

The following may identify candidate URLs but cannot publish directly:

- GDELT
- Google News RSS
- NewsAPI
- Firecrawl search
- Social media
- LinkedIn
- X/Twitter
- Facebook
- Instagram
- Reddit
- YouTube
- PRNewswire
- GlobeNewswire
- OpenPR
- Biztoc and other aggregators
- General blogs without a clear editorial standard

A discovery candidate can become publishable only after the final article URL resolves to an approved Tier 1 or Tier 2 domain and passes the normal validation pipeline.

## 2. Current XML/RSS/Atom source catalog

The automatic engine currently polls these XML feeds:

```text
https://www.datacenterdynamics.com/en/rss/
https://www.datacenterknowledge.com/rss.xml
https://www.capacitymedia.com/feed
https://blocksandfiles.com/feed/
https://www.servethehome.com/feed/
https://www.theregister.com/data_centre/headlines.atom
```

The source registry stores the source name, canonical domain, feed URL, tier, source type, reliability score, active status, and feed-health fields.

### Source health requirements

Each feed run must record:

- HTTP status
- Final response URL
- Response content type
- XML/RSS/Atom detection result
- Number of items found
- Number of valid items
- Last successful check
- Error message if the feed fails

A feed failure must not cause stories from an untrusted source to enter the public feed.

## 3. XML and Atom parsing rules

The parser must support both RSS 2.0 and Atom.

### RSS fields

Preferred RSS mapping:

| RSS/XML field | Database field | Rule |
|---|---|---|
| `item/title` | `title` | Required; minimum meaningful length |
| `item/link` | `source_url` | Required; must be HTTP/HTTPS |
| `item/guid` | fallback URL | Use only when `link` is absent and it is a valid URL |
| `item/description` | `summary` | Strip HTML and decode entities |
| `item/pubDate` | `original_published_at` | Required; must parse to a valid timestamp |
| `item/category` | optional category hint | Never override editorial classification automatically |
| `media:content` | optional image | Store only if the URL is valid |
| `dc:creator` | optional author | Store if the schema later includes authors |

### Atom fields

Preferred Atom mapping:

| Atom/XML field | Database field | Rule |
|---|---|---|
| `entry/title` | `title` | Required |
| `entry/link href="..."` | `source_url` | Required; canonical link preferred |
| `entry/summary` | `summary` | Preferred summary |
| `entry/content` | `summary` fallback | Strip markup and limit length |
| `entry/published` | `original_published_at` | Preferred publication date |
| `entry/updated` | date fallback | Use only if `published` is absent and mark the date as updated-derived |
| `entry/author/name` | optional author | Store if supported later |

### XML safety rules

- Accept only valid RSS or Atom-like XML responses.
- Reject HTML error pages returned with HTTP 200.
- Reject missing or invalid article URLs.
- Reject missing publication dates for automatic publication.
- Reject malformed dates rather than replacing them with the ingestion time.
- Resolve relative URLs against the feed URL where necessary.
- Remove tracking parameters only when the canonical URL remains unambiguous.
- Preserve the original URL for audit purposes.
- Reject source URLs whose hostname does not match the allowlisted domain.
- Deduplicate by canonical URL and normalized title hash.
- Never execute or render XML content as code.
- Limit feed size and item count per source to prevent runaway jobs.

## 4. Free and fast discovery: GDELT

GDELT is free and can search recent coverage using its DOC API. It supports ArticleList output in RSS, JSON, and JSONFeed formats. Its query window can be narrowed to minutes, with a documented minimum of 15 minutes, and ArticleList results can be limited to 250 records.

Recommended discovery queries:

```text
"data center" AND (UAE OR Dubai OR Saudi OR Riyadh OR Qatar OR Bahrain OR Oman OR Kuwait)
"hyperscale" AND (Middle East OR Gulf OR Saudi OR UAE)
"cloud region" AND (Saudi OR UAE OR Qatar)
"colocation" AND (Middle East OR GCC)
"data center" AND (power OR cooling OR renewable OR AI)
```

GDELT flow:

```text
GDELT RSS/JSON discovery
  → candidate URL table
  → canonical URL resolution
  → approved-domain check
  → original page date check
  → content extraction
  → duplicate check
  → editorial quality gate
  → published or human review
```

GDELT must never be treated as the source of truth. It identifies coverage; the original article or official announcement remains the evidence source.

## 5. Official primary-source monitoring

The next Tier 1 expansion should monitor official announcement pages and XML sitemaps for organizations active in the region.

### Cloud and technology providers

- Microsoft News Center EMEA and Middle East announcements
- AWS News and regional press announcements
- Google Cloud News and regional announcements
- Oracle Cloud announcements
- IBM and GPU infrastructure announcements where relevant

### Middle East operators and ecosystem companies

- Khazna
- G42
- e&
- stc / Center3
- Gulf Data Hub
- MEEZA
- DataVolt
- Moro Hub
- Injazat / Core42
- Equinix regional announcements
- Digital Realty regional announcements
- NTT, Gulf Bridge International, and other connectivity providers where the announcement concerns data-center infrastructure

### Government, policy, and infrastructure bodies

- Saudi MCIT and related digital-infrastructure authorities
- UAE digital-government and energy authorities
- Qatar communications and energy authorities
- Bahrain, Kuwait, and Oman digital-infrastructure authorities
- Economic-development agencies
- Utilities and renewable-energy authorities
- Official tender and procurement portals

These sources should be monitored through the following order of preference:

1. Official RSS or Atom feed
2. XML sitemap filtered for news or press-release URLs
3. Official news archive with publication metadata
4. JSON-LD `NewsArticle` or `Article` metadata
5. Manual source review if none of the above exists

An official company announcement is primary evidence for what the company announced. It is not independent verification of every commercial claim inside the announcement.

## 6. Validation pipeline

```text
1. Fetch source in parallel
2. Confirm HTTP success
3. Confirm XML/RSS/Atom or approved official page format
4. Parse article fields
5. Validate canonical URL and source domain
6. Validate publication date
7. Reject future-dated or stale items
8. Normalize title, URL, source, and text
9. Deduplicate URL and title
10. Classify Tier 1 or Tier 2
11. Run strict editorial quality gate
12. Require corroboration for high-impact claims
13. Store provenance and validation fields
14. Publish or route to human review
```

### Automatic publication requirements

All of the following are required:

- Approved source policy
- Valid canonical URL
- Correct source-domain match
- Real publication date
- Recent enough to be relevant
- Meaningful title
- Industry relevance
- No obvious duplicate
- Editorial quality score of at least 7/10
- No prompt-injection or malformed-content indicators

If any required validation step fails, the item is not published.

## 7. High-impact claim rules

The following claims require Tier 1 evidence or corroboration by two independent Tier 2 sources:

- MW capacity
- Investment amount
- Facility opening or operational date
- Land acquisition
- Government policy or regulation
- Cloud-region availability
- Data-center construction status
- Acquisition or ownership change
- Executive appointment
- Customer or contract claim
- Energy, water, or sustainability performance claim

The article may still be published as a clearly labelled report if the claim is attributed precisely:

> “Company X announced…”

Do not rewrite a company announcement into an unattributed fact.

## 8. Database provenance fields

Every newly published article should record:

```text
source
source_url
source_domain
source_tier
source_type
source_reliability_score
is_primary_source
publication_status
validation_status
validation_score
corroboration_count
original_published_at
validated_at
validation_notes
```

### Status meanings

| Status | Meaning | Public? |
|---|---|---|
| `published` | Passed source and editorial gates | Yes |
| `pending_review` | Candidate retained for human review | No |
| `archived` | Retained for history but removed from feed | No |
| `rejected` | Failed source or content policy | No |

## 9. Failure behavior

The pipeline must fail closed:

- Missing AI key → publish zero items
- Invalid AI output → publish zero items from that batch
- Broken XML → skip that source
- HTTP 403/404/5xx → record feed failure and skip source
- Invalid date → skip item
- Unknown domain → skip item
- Duplicate URL → skip item
- Missing title → skip item
- Missing link → skip item
- Missing publication date → skip item

No failure should result in “publish everything.”

## 10. Speed design

For speed without weakening trust:

- Run direct trusted feeds every 30–60 minutes if the provider permits it.
- Run GDELT discovery every 15–30 minutes.
- Fetch all sources in parallel.
- Use a candidate table so discovery does not block publication.
- Cache feed responses with conditional requests where supported.
- Use a short AI quality-gate batch.
- Keep the public publication transaction separate from discovery.
- Use a human review queue for high-impact or ambiguous claims.

The current public publishing schedule remains every two hours until source-health metrics justify a shorter interval.

## 11. Sources explicitly excluded from auto-publication

The following are not reliable enough to publish directly:

- Social posts
- Search-result snippets
- NewsAPI free-plan results
- GDELT results without original-source validation
- Firecrawl search results without original-source validation
- Press-release distribution pages treated as independent reporting
- Aggregator pages
- Unattributed blogs
- AI-generated summaries without source evidence

## 12. Editorial labels

Use labels that make the evidence level clear:

- **Official announcement**
- **Reported by specialist media**
- **Independent corroboration**
- **Company-reported figure**
- **Requires corroboration**
- **Editorially reviewed**

Never display a company press release as independent journalism.

## 13. Operating checklist for adding a source

Before activating a new source, confirm:

- Canonical domain
- Ownership and publisher identity
- Editorial or correction policy
- Feed or sitemap reliability
- Publication-date quality
- Relevance to data centers or regional infrastructure
- Whether it is primary, specialist, business media, press-release, or aggregation
- Whether its content may be reused or only linked to
- Whether rate limits permit the desired polling frequency
- Whether the source should auto-publish or require review

Record the result in `public.news_sources` before adding the source to the ingestion function.

## 14. Recommended next implementation

The next technical additions should be:

1. A `news_candidates` table for GDELT and other discovery results.
2. A GDELT RSS/JSON discovery Edge Function that never publishes directly.
3. Official-source sitemap monitors for the highest-value operators and government bodies.
4. Primary-source validation fields and labels in the frontend.
5. A human review queue for high-impact claims.
6. Feed-health metrics and alerts for broken XML sources.
7. Corroboration links between articles that report the same project or claim.

## Final rule

Data Center Pulse should be fast because it discovers early, not because it publishes first without evidence.

The correct product promise is:

> **Early signals, clearly sourced, professionally validated.**
