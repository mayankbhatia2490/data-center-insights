# GCC Data Center Map

The `/stats` page now includes an interactive Leaflet map and searchable GCC inventory. The map uses OpenStreetMap tiles and supports facility search, country filtering, lifecycle filtering, marker selection, and facility detail results.

## Data behavior

The page reads from the Supabase `data_centers` table when the migration has been applied. Until that table is available, it falls back to the curated seed index in `src/data/gccDataCenters.ts`, so the page does not fail during first deployment.

The initial index is intentionally evidence-aware. Most facilities have city-centroid coordinates and `capacity_mw = null` because a missing capacity value must not be interpreted as zero. The page reports both the number of facilities in view and the number with disclosed capacity. Capacity is displayed only when a facility-level source supports it.

The migration includes a first reported facility-level capacity value for Center3 Khurais Riyadh: 9.6 MW, sourced from Data Center Dynamics. Portfolio-level announcements are not automatically copied onto each facility, which prevents double counting.

## Database tables

- `data_centers`: canonical facility record, coordinates, operator, lifecycle, service types, capacity, and verification status.
- `data_center_sources`: evidence and observed values from operator, government, regulatory, industry, manual, or user-submitted sources.
- `data_center_review_queue`: uncertain or conflicting records for human review.

The `verify-data-centers` Edge Function checks source reachability and whether the facility name, operator, city, and capacity claim are supported by the source. Scores of 75 or above are automatically accepted; lower scores go to the review queue.

## Deployment

```sh
supabase db push
supabase functions deploy verify-data-centers
npm run build
```

The daily schedule is created only when the database has `app.settings.supabase_url` and `app.settings.service_role_key` configured. Otherwise, schedule the function through the project’s existing Supabase cron mechanism. Never expose the service-role key in Vercel frontend variables.

## Expanding to full GCC coverage

The initial seed is not a claim that it contains every facility in the region. To load the full licensed dataset, import an authorized CSV or GeoJSON export into `data_centers`, map the source fields to the schema, preserve the original source URL and export date in `data_center_sources`, and set every imported record to `needs_review` until it passes automated checks or human review.

A safe import must preserve:

- Stable external ID and parent ID.
- Operator and facility aliases.
- Exact versus approximate coordinate precision.
- Capacity basis and whether the value is operational, announced, estimated, or fully built-out.
- Lifecycle stage and evidence date.
- Source URL and source type.

Do not scrape or redistribute restricted directory data. Use a licensed export or first-party and publicly permitted sources.
