# Reliable News Validation

## Current policy

The public news feed now auto-ingests only six allowlisted specialist or established industry sources:

- Data Center Dynamics
- Data Center Knowledge
- Capacity Media
- Blocks & Files
- ServeTheHome
- The Register data-center feed

Tier 3 sources such as social networks, aggregators, NewsAPI discovery results, Firecrawl search results, press-release wires, Reddit, and general blogs are no longer auto-ingested.

## Validation gates

A story must pass all of these gates before publication:

1. It came from an allowlisted source.
2. The URL hostname matches the source's canonical domain.
3. The feed response is valid RSS or Atom.
4. The story has a real publication date.
5. The story is no more than 14 days old and is not materially future-dated.
6. The title is meaningful and not a placeholder.
7. The strict AI editorial gate scores it at least 7/10.
8. The insertion records source domain, tier, source type, reliability score, original publication date, validation score, and validation time.

The pipeline fails closed. If the AI key is missing, the feed is malformed, the source is unavailable, or the AI response is invalid, no article is auto-published.

## Database statuses

- `published` — passed the source and editorial gates.
- `pending_review` — retained for human review but not displayed publicly.
- `archived` — retained for history but removed from the public feed.
- `rejected` — failed the publication policy.

All pre-existing articles were archived because they were collected before this validation policy existed. They are not deleted and can be re-validated later if needed.

## Human review rule

Tier 2 reporting is reliable secondary journalism, not proof of every underlying claim. High-impact claims involving capacity, investment value, project status, regulatory action, or leadership appointments should later be corroborated with a primary source or a second independent specialist source.

## Future source additions

A new source should not be added directly to the function. Add it to the source registry only after checking:

- Ownership and editorial standards
- Canonical domain
- Feed reliability
- Publication dates
- Industry relevance
- Correction policy
- Whether the source is reporting, press-release distribution, or aggregation

Primary sources such as government agencies, regulators, company investor-relations pages, operator pressrooms, and official filings should be added as a separate Tier 1 pathway with stronger evidence handling—not mixed into the general RSS list.
