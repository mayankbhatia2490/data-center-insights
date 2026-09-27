

## 15. Implemented candidate and meaning pipeline

The documented architecture is now implemented in Supabase.

### Discovery function

`discover-news-gdelt` runs every 30 minutes and queries the free GDELT DOC API for GCC and Middle East data-center topics. It stores results in `public.news_candidates` and never publishes directly.

Each candidate stores:

- Discovery source
- Discovered URL
- Canonical URL
- Title and summary
- Source domain
- Source tier and type when recognized
- Reliability score when recognized
- Publication timestamp
- Raw discovery payload
- Candidate status

Unknown domains may be retained as discovery leads, but only recognized Tier 1 and Tier 2 domains are eligible for the publication function.

### Meaning-aware publication function

`fetch-news` now combines:

1. Trusted RSS/Atom feeds
2. Trusted GDELT candidates
3. Canonical URL and domain validation
4. Publication-date validation
5. Duplicate detection
6. Strict editorial quality scoring
7. Meaning and impact extraction
8. Entity and claim classification
9. Confidence scoring
10. Database provenance recording

The AI meaning pass produces:

- A factual one-sentence summary
- Why the story matters to operators and investors
- Capacity, power, cloud, regulation, investment, technology, or market impact
- Claim type
- Named companies, people, and places
- Sentiment
- Grounded source excerpt
- Importance score from 1–10

The generated meaning is stored in both `articles.meaning` and the existing `articles.insight` field so the current website components can display it without a separate frontend migration.

### Confidence score

The current confidence score is calculated from source reliability and editorial quality:

```text
confidence = (source reliability × 60%) + (editorial score × 10 × 40%)
```

This is an evidence confidence indicator, not a probability that every statement is true. High-impact claims still require a Tier 1 source or corroboration.

### Public publication rule

An article is published only when:

- It comes from a trusted feed or trusted discovery candidate.
- Its URL matches the recognized source domain.
- Its publication date is valid and recent.
- It passes the editorial score threshold of 7/10.
- Meaning extraction returns a factual summary, meaning statement, and source excerpt.

If the AI quality gate or meaning pass fails, the run fails closed and publishes zero new articles from that run.

### Current schedule

| Job | Frequency | Role |
|---|---:|---|
| `discover-news-gdelt-every-30m` | Every 30 minutes | Discover and store candidate URLs |
| `fetch-news-every-2h` | Every 2 hours | Validate, explain, and publish trusted articles |

The discovery and publication stages are intentionally separate. This prevents GDELT or any other discovery provider from bypassing the trusted-source policy.
