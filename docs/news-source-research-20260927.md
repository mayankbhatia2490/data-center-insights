# News Source Research — 27 September 2026

## GDELT

Official source: https://gdeltproject.org/data.html
Official DOC API documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

GDELT states that its database is 100% free and open. The DOC 2.0 API supports ArticleList output in RSS, JSON, and JSONFeed formats. It supports TIMESPAN values down to minutes, with a minimum of 15 minutes, and can return up to 250 ArticleList records. GDELT is therefore useful for fast discovery and monitoring, but it is an index of global news coverage rather than proof that the underlying article is reliable. Candidate URLs must still pass the Data Center Pulse domain allowlist and validation policy.

## NewsAPI

Official pricing: https://newsapi.org/pricing

The free Developer plan is for development and testing, has a 24-hour delay, 100 requests per day, no uptime SLA, and cannot be used in production or published commercial projects. It should not be used as the live production source for Data Center Pulse unless a commercial plan and rights are obtained.

## Primary-source pattern

Example official announcement: https://news.microsoft.com/source/emea/2026/08/microsoft-announces-saudi-arabia-east-datacenter-region-will-be-available-in-november-2026/

An official operator/company source can provide concrete facts such as location, availability date, facility scope, investment context, named officials, and supporting reports. These should be treated as primary sources but labelled as company or government announcements, not independent journalism. Claims should be marked as self-reported where appropriate.

## Recommendation

Use direct RSS/Atom feeds and official pressroom/sitemap monitors for auto-publication. Add GDELT as a fast discovery stream only. Do not let GDELT, NewsAPI, social posts, or aggregators auto-publish unless the final canonical URL belongs to an allowlisted Tier 1 or Tier 2 source and passes validation.
