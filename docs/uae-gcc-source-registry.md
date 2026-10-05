# UAE/GCC source registry

## Implemented policy

The ingestion system now uses one shared source registry for the UAE/GCC intelligence pipeline. The registry is used by both GDELT discovery and the validated RSS/Atom fetcher, so a domain cannot be trusted by one path and rejected by the other.

### Directly monitored primary sources

- Khazna Data Centers — `https://khaznadatacenters.com/feed/`
- MEEZA — `https://www.meeza.net/category/news-and-press-releases/feed/`

These are treated as official company announcements. They may enter the editorial pipeline, but capacity, lifecycle, ownership, location, investment and completion claims still require corroboration or human review.

### Directly monitored Tier 2 sources

- Data Center Dynamics
- Data Center Knowledge
- Capacity Media
- The Register data-centre Atom feed

These provide specialist context and corroboration. They are not treated as authoritative proof of facility MW or project completion.

### Tier 1 primary sources discovered through GDELT

- G42
- Core42
- DataVolt
- Center3
- e&
- Moro Hub
- Gulf Data Hub
- Microsoft News
- AWS News
- Google Cloud
- Oracle Cloud

GDELT is only the discovery mechanism. The final article URL must match an allowlisted domain before it can enter the trusted-candidate queue.

### Tier 2 discovery-only sources

- Reuters
- MEED
- Gulf Business
- Arabian Business
- Zawya

These remain discovery-only because no licensed direct feed is configured. They are stored with source provenance but are not directly polled or auto-published from an unlicensed feed.

## Reliability rules

A valid source URL and publication date are required. Feed responses must be XML/RSS/Atom, article URLs must remain on the allowlisted domain, and stale or future-dated items are rejected. The AI quality and meaning gates remain mandatory.

High-impact claims—including MW capacity, investment, opening date, ownership, construction status, government policy and sustainability performance—are not equivalent to verified facility facts merely because they came from a Tier 1 source. They remain attributed claims until corroborated or reviewed by a human.

## Supabase configuration

Migration: `20261005053000_uae_gcc_source_registry.sql`

The `news_sources` table now records `region`, `direct_monitor`, and `discovery_only_reason`. The migration deactivates the previously polled low-priority `Blocks & Files` and `ServeTheHome` sources to keep the GCC feed focused.
