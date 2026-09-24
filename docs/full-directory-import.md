# Full Middle East Directory Import

## Source and authorization status

Data Center Map’s public Middle East page currently reports 331 records across 18 countries, while the Explorer page is a three-record demo unless a full export is purchased or otherwise authorized. The public Terms of Use prohibit scraping, automated retrieval, and copying site data into an external database without authorization. Therefore, this repository does **not** contain a scraped copy of the requested 161-record list.

A full import is supported only from a CSV or GeoJSON export that the project is authorized to use. The importer requires an explicit environment acknowledgement so a restricted export cannot be loaded accidentally.

## Import command

From the repository root:

```sh
DATA_CENTER_MAP_LICENSE_ACK=true \
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
node scripts/import-data-centers.mjs /path/to/authorized-export.csv
```

GeoJSON is also supported:

```sh
DATA_CENTER_MAP_LICENSE_ACK=true \
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
node scripts/import-data-centers.mjs /path/to/authorized-export.geojson
```

The importer maps Data Center Map-style fields including facility name, Data Center ID, parent ID, company and company ID, profile and website URLs, lifecycle stage, listing type, capacity type, fully built-out power, latitude, longitude, address and address details, postal, city, market, state, country, whitespace, total building size, year operational, PUE, site code, tier design, and ecosystem statistics. Imported records start at `needs_review`, and original export provenance is written to `data_center_sources`.

The importer intentionally does not publish a facility as verified. Run the automated verifier and complete human review after import:

```sh
supabase functions deploy verify-data-centers
```

## Dashboard aggregates

The Stats page now calculates country and operator aggregates from the normalized `data_centers` table, or from the transparent GCC fallback index until the database table is populated. Capacity charts include only facility-level values with `capacity_mw`; records with missing capacity remain in the facility count but do not contribute zero-valued capacity claims.

The two aggregate charts are:

- **Reported Capacity by Country**: sum of reported facility-level MW by country.
- **Reported Capacity by Operator**: top operators by reported facility-level MW.

The charts respond to the map search, country, and lifecycle filters, which makes them useful for comparing the selected market rather than presenting a misleading global total.
