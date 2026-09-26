# Master Website Audit Prompt — Data Center Pulse

Copy and paste the prompt below into an AI agent with access to the live website, GitHub repository, Supabase project, and Vercel deployment.

---

## Prompt

You are a senior product strategist, UX researcher, technical architect, editorial director, data-quality auditor, SEO strategist, and B2B growth consultant.

Audit the actual **Data Center Pulse** product, not an imagined version.

### Product context

- Live website: `https://data-center-insights-fawn.vercel.app/`
- Repository: `mayankbhatia2490/data-center-insights`
- Primary product direction: Middle East and GCC data-center intelligence
- Current major concepts: news, market statistics, data-center map, facilities, people/leaders, automated verification, newsletter potential, future events, industry sponsorships, advertising, research, and professional data products
- Current technical stack appears to include React/Vite, Vercel, Supabase, Leaflet, Supabase Edge Functions, scheduled verification jobs, and GitHub-based deployment. Confirm this from the actual repository and deployment rather than assuming it.

### Important operating rule

First inspect and document the current state. Do not modify code, database, content, configuration, or deployment until the audit and prioritized recommendations are complete and explicitly approved.

If a page or service is inaccessible, record the exact limitation and continue with the accessible evidence. Clearly separate:

- Observed fact
- Inference
- Recommendation
- Unknown requiring verification

Do not invent metrics, traffic, users, revenue, data quality, or integrations.

---

## Phase 1 — Establish the real current state

Inspect the live website page by page. At minimum inspect:

- Homepage
- News or briefing pages
- Middle East pages
- Statistics page
- Data-center map
- Facility detail pages
- Leaders and people pages
- Leader profile pages
- Intelligence and insights pages
- Login, subscribe, and account flows
- Admin or claim workflows if accessible
- Mobile and desktop layouts
- Error, loading, empty, and no-data states

For each important page document:

| Page | Purpose | Main audience | Primary action | Current content | Strength | Problem | Recommendation |
|---|---|---|---|---|---|---|---|

Capture the actual page titles, navigation labels, visible calls to action, filters, charts, forms, source labels, trust indicators, and repeated components.

Check whether the website immediately communicates:

1. What the product is
2. Who it is for
3. Why it is different
4. Why a visitor should return
5. What action the visitor should take next

### Required live-site observations

Record:

- First impression in the first 10 seconds
- Clarity of positioning
- Navigation complexity
- Visual hierarchy
- Typography and readability
- Color and branding consistency
- Mobile usability
- Page speed and obvious loading issues
- Broken links and broken images
- Blank-screen or refresh failures
- Empty states
- Duplicate or confusing content
- Unclear labels
- Unsupported claims or unexplained statistics
- Whether data appears current
- Whether sources and update dates are visible

Take screenshots or save evidence for important findings.

---

## Phase 2 — Inspect the actual repository and architecture

Inspect the GitHub repository structure, including:

- Frontend pages and routes
- Components
- Hooks and data fetching
- Supabase client configuration
- Database migrations
- Row-level security policies
- Supabase Edge Functions
- Scheduled jobs and cron configuration
- Seed data and imported datasets
- Data-center schemas
- People and leader schemas
- Citation, source, evidence, and verification tables
- Newsletter or subscriber implementation
- Authentication and claim workflows
- Error handling
- Analytics
- Environment variables
- Build and deployment configuration
- Tests and test coverage
- Documentation

Produce a real architecture summary:

```text
Browser
  → React/Vite application
  → Supabase client or API
  → Supabase tables/views/functions
  → Scheduled jobs and external data sources
  → Human review and publication
```

Replace this example with the actual architecture discovered.

### Technical questions to answer

1. Which pages use live Supabase data?
2. Which pages use static fallback data?
3. What happens when Supabase is unavailable?
4. Can a single malformed record crash the whole page?
5. Are null coordinates, missing capacity, missing lifecycle, and missing source values handled safely?
6. Are database records normalized before rendering?
7. Are source records and verification states preserved?
8. Is the automated verification pipeline actually deployed and scheduled?
9. Are scheduled jobs running successfully?
10. Are the required Vercel and Supabase environment variables configured correctly?
11. Are public keys used only in safe frontend contexts?
12. Are service-role keys protected from the browser?
13. Are RLS policies preventing unauthorized writes?
14. Is the current data model extensible for news, projects, events, jobs, sponsors, and reports?
15. What technical debt will become expensive if ignored now?

---

## Phase 3 — Audit the data and intelligence logic

Inspect the actual data-center inventory and determine:

- Total records
- Countries covered
- GCC records
- Middle East records
- Records with coordinates
- Records with approximate or market-level coordinates
- Records with facility-level capacity
- Records with operator names
- Records with lifecycle status
- Records with source URLs
- Records with verification status
- Records needing human review
- Duplicate or likely duplicate records
- Records using weak or unclear sources
- Stale records
- Missing important fields

Do not treat missing capacity as zero. Explain clearly how the product distinguishes:

- Confirmed capacity
- Announced capacity
- Estimated capacity
- Not disclosed
- Unknown

Review the logic for:

- Country filtering
- GCC filtering
- Map marker selection
- Capacity aggregation
- Operator aggregation
- Lifecycle filtering
- Search
- Coordinate enrichment
- Automated verification
- Human approval
- Data freshness

Identify every place where users could misunderstand the data.

Recommend the minimum data-quality rules needed for professional credibility.

---

## Phase 4 — Audit editorial and recognition strategy

Evaluate whether the current website can become a trusted Middle East industry publication.

Assess:

- News quality
- Source quality
- Primary-source usage
- Original reporting potential
- Regional depth
- Country balance
- Engineering relevance
- Executive relevance
- Repetition and content gaps
- Whether the site feels like a publication, database, dashboard, or unfinished combination
- Whether the people section feels credible
- Whether recognition is evidence-based or popularity-based
- Whether sponsored recognition could damage trust

Recommend a clear editorial model with no more than five core content pillars.

For people recognition, define a safe model distinguishing:

- Nominated
- Editorially recognized
- Verified profile
- Claimed profile
- Sponsored profile

Explain what should be kept, simplified, removed, or delayed.

---

## Phase 5 — Audit the business and growth model

Assess the realistic path to becoming a leading Middle East data-center intelligence platform.

Evaluate potential products:

- Free news briefing
- Professional newsletter
- Facility and operator database
- Market reports
- Paid alerts
- Data exports
- API access
- Events
- Jobs
- Supplier directory
- Sponsorships
- Advertising
- Research services
- Executive briefings
- Training and partnerships

For each product estimate relative:

| Product | User value | Revenue potential | Effort | Time to launch | Dependency | Priority |
|---|---:|---:|---:|---:|---|---:|

Do not recommend building all of them. Select the smallest set that creates a strong flywheel:

```text
Useful intelligence
  → Repeat visits
  → Newsletter subscribers
  → Professional trust
  → Nominations, corrections, and data contributions
  → Better dataset
  → Paid reports, sponsorships, events, and data products
```

Explain how to build audience without depending on paid advertising.

Recommend a newsletter strategy, event strategy, sponsor strategy, and first paid product.

---

## Phase 6 — Decide what to keep, improve, remove, or postpone

Create four tables.

### Keep

Existing features that are valuable and should remain.

### Improve

Existing features with strong potential but poor execution, unclear positioning, or weak usability.

### Remove or simplify

Features that create noise, confusion, maintenance cost, or weak user value.

### Postpone

Good ideas that should not be built until there is audience demand or stronger data.

Use this scoring model:

```text
Priority score = (User value × Strategic differentiation × Revenue potential) ÷ (Effort × Risk)
```

Use scores from 1 to 5 and show the assumptions.

---

## Phase 7 — Produce a practical roadmap

Create a roadmap with three horizons.

### Next 14 days

Only quick improvements that make the current site clearer, more stable, and more trustworthy.

### Next 30–90 days

The smallest product improvements that increase repeat visits, newsletter signup, data quality, and professional credibility.

### Later 6–18 months

Events, sponsorships, advertising, paid data, APIs, jobs, research, and other expansion products.

For every recommendation include:

- Problem
- Proposed change
- User benefit
- Business benefit
- Estimated effort
- Dependencies
- Risk
- Success metric
- Whether it requires code, content, data, design, partnerships, or operations

---

## Phase 8 — Define the leadership plan

Recommend the smallest team or operating model needed:

- Founder/editor responsibilities
- Technical responsibilities
- Data verification responsibilities
- Editorial contributors
- Event and partnership responsibilities
- Sales and sponsorship responsibilities

Explain what can be automated and what should remain human-reviewed.

Use this principle:

> Automation discovers, normalizes, scores, and alerts. Humans approve important claims, recognition, corrections, and commercial/editorial boundaries.

---

## Final deliverable format

Produce a direct, executive-quality report with these sections:

1. Executive diagnosis — no more than 200 words
2. What the website actually is today
3. Current architecture and data flow
4. What is good and must be protected
5. What is weak or confusing
6. What should be removed or simplified
7. Data and trust risks
8. Best positioning statement
9. Recommended target audiences
10. Recommended content model
11. Recommended newsletter model
12. Recommended events and advertising model
13. Revenue opportunities ranked by effort and potential
14. Keep / Improve / Remove / Postpone tables
15. Priority score table
16. 14-day plan
17. 30–90-day plan
18. 6–18-month plan
19. Risks and decisions requiring founder approval
20. The five most important actions to take next

End with a single clear recommendation answering:

> What should Data Center Pulse become, and what should the team stop doing?

Be concrete. Avoid generic advice such as “improve SEO,” “use social media,” or “add more content” unless you specify exactly what to do, why it matters, how much effort it requires, and how success will be measured.

Do not change the product during the audit. Deliver the report first.
