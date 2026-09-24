# Overpass Coordinate Enrichment

The project now uses the free OpenStreetMap Overpass API to enrich missing data-center coordinates. The enrichment function is deployed as `enrich-data-center-coordinates` in Supabase and runs daily at 04:20 UTC after the source-verification job.

The function selects only GCC records whose latitude is missing, groups them by country, and queries bounded GCC country boxes for OpenStreetMap objects tagged as `telecom=data_center`, `man_made=data_center`, or named like a data center, data centre, or data park. It matches candidates using normalized facility-name tokens, operator tokens, city tokens, and the strength of the OSM data-center tag.

A coordinate is accepted into the inventory only as an **approximate candidate** when the match score reaches 60 or higher. The original inventory record is not overwritten if it already has coordinates. Every candidate creates an `OpenStreetMap via Overpass API` source record and a pending human-review queue item. The pipeline therefore improves map coverage without presenting an OSM match as exact or verified.

OpenStreetMap data is reusable under the Open Database License (ODbL), subject to attribution and share-alike obligations. The public application should retain an attribution link to OpenStreetMap and should not imply that Overpass confirms facility capacity, lifecycle, operator identity, or exact site boundaries. Overpass is a coordinate-discovery source only; capacity remains null until supported by an operator, government, regulatory, or credible industry source.

The function is JWT-protected. It is not called directly by the browser. Supabase cron invokes it with the service-role authorization configured in the project settings. If the scheduled job does not run, confirm that `app.settings.supabase_url` and `app.settings.service_role_key` are configured and that the `pg_cron` and `pg_net` extensions are enabled.
