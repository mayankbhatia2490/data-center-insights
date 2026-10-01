// Pure facility helpers shared by the app, the build-time sitemap and the tests.
// Keep imports relative and type-only: scripts/generate-sitemap.ts loads this file with tsx.
import type { Database } from "../integrations/supabase/types";

export type FacilityRow = Database["public"]["Tables"]["data_centers"]["Row"];

export type Facility = Pick<
  FacilityRow,
  | "id"
  | "slug"
  | "canonical_name"
  | "country"
  | "city"
  | "operator_name"
  | "address"
  | "latitude"
  | "longitude"
  | "location_precision"
  | "lifecycle_stage"
  | "capacity_mw"
  | "capacity_status"
  | "year_operational"
  | "estimated_energization"
  | "website_url"
  | "verification_status"
  | "last_verified_at"
  | "listing_type"
  | "updated_at"
>;

export const FACILITY_COLUMNS =
  "id, slug, canonical_name, country, city, operator_name, address, latitude, longitude, location_precision, lifecycle_stage, capacity_mw, capacity_status, year_operational, estimated_energization, website_url, verification_status, last_verified_at, listing_type, updated_at";

// A facility page is only indexable when at least this many of the 10 key fields are filled.
// Thin pages hurt more than they help (docs/technical-seo-spec.md). Change it here only.
export const INDEX_THRESHOLD = 5;

const filled = (v: string | null | undefined) => typeof v === "string" && v.trim() !== "";

export const KEY_FIELDS: { key: string; label: string; has: (f: Facility, sourceCount: number) => boolean }[] = [
  { key: "operator", label: "Operator", has: (f) => filled(f.operator_name) },
  { key: "city", label: "City", has: (f) => filled(f.city) },
  { key: "address", label: "Address", has: (f) => filled(f.address) },
  { key: "coordinates", label: "Coordinates", has: (f) => f.latitude != null && f.longitude != null },
  { key: "stage", label: "Stage", has: (f) => f.lifecycle_stage !== "unknown" },
  { key: "capacity", label: "Capacity", has: (f) => f.capacity_mw != null },
  { key: "timeline", label: "Year or energization date", has: (f) => f.year_operational != null || filled(f.estimated_energization) },
  { key: "website", label: "Website", has: (f) => filled(f.website_url) },
  { key: "sources", label: "At least one source", has: (_f, sourceCount) => sourceCount > 0 },
  { key: "verified", label: "Verified", has: (f) => f.verification_status === "verified" },
];

export function completeness(f: Facility, sourceCount: number) {
  const present = KEY_FIELDS.filter((k) => k.has(f, sourceCount)).map((k) => k.key);
  return { score: present.length, total: KEY_FIELDS.length, present };
}

export function isIndexable(f: Facility, sourceCount: number) {
  return f.listing_type === "facility" && completeness(f, sourceCount).score >= INDEX_THRESHOLD;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const countrySlug = (country: string) => slugify(country);

export const facilityPath = (f: Pick<Facility, "country" | "slug">) => `/data/facilities/${countrySlug(f.country)}/${f.slug}`;

const STAGES: Record<string, string> = {
  operational: "Operational",
  under_construction: "Under construction",
  planned: "Planned",
  land_banked: "Land banked",
  decommissioned: "Decommissioned",
};

export const stageLabel = (stage: string) => STAGES[stage] ?? "Not disclosed";

export function capacityLabel(f: Pick<Facility, "capacity_mw" | "capacity_status">): string {
  if (f.capacity_mw == null) return "Not disclosed";
  const qualifier = f.capacity_status === "announced" || f.capacity_status === "reported" ? ` (${f.capacity_status})` : "";
  return `${f.capacity_mw} MW${qualifier}`;
}

export function facilityTitle(f: Pick<Facility, "canonical_name" | "city">): string {
  const where = f.city && f.city !== f.canonical_name ? `, ${f.city}` : "";
  return `${f.canonical_name}${where}: capacity, status and history`;
}

// Built only from fields the record has, so it never states something we do not know.
export function facilityDescription(f: Facility, max = 155): string {
  const place = [f.city, f.country].filter(Boolean).join(", ");
  const by = filled(f.operator_name) ? `, operated by ${f.operator_name}` : "";
  const stage = f.lifecycle_stage !== "unknown" ? ` Stage: ${stageLabel(f.lifecycle_stage).toLowerCase()}.` : "";
  const cap = f.capacity_mw != null ? ` Capacity: ${capacityLabel(f)}.` : " Capacity not disclosed.";
  const text = `${f.canonical_name} is a data center in ${place}${by}.${stage}${cap}`;
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function trackerStats(facilities: Facility[], sourceCounts: Record<string, number>) {
  const n = facilities.length;
  const count = (fn: (f: Facility) => boolean) => facilities.filter(fn).length;
  const byCountry = new Map<string, { total: number; operational: number; underConstruction: number; planned: number; unknown: number }>();
  for (const f of facilities) {
    const row = byCountry.get(f.country) ?? { total: 0, operational: 0, underConstruction: 0, planned: 0, unknown: 0 };
    row.total += 1;
    if (f.lifecycle_stage === "operational") row.operational += 1;
    else if (f.lifecycle_stage === "under_construction") row.underConstruction += 1;
    else if (f.lifecycle_stage === "planned") row.planned += 1;
    else row.unknown += 1;
    byCountry.set(f.country, row);
  }
  return {
    total: n,
    countries: byCountry.size,
    byCountry: [...byCountry.entries()].sort((a, b) => b[1].total - a[1].total),
    withCoordinates: count((f) => f.latitude != null && f.longitude != null),
    withCapacity: count((f) => f.capacity_mw != null),
    withSource: count((f) => (sourceCounts[f.id] ?? 0) > 0),
    verified: count((f) => f.verification_status === "verified"),
    indexable: count((f) => isIndexable(f, sourceCounts[f.id] ?? 0)),
  };
}

export function buildFacilityJsonLd(f: Facility, siteUrl: string): Record<string, unknown>[] {
  const url = `${siteUrl}${facilityPath(f)}`;
  const address: Record<string, string> = { "@type": "PostalAddress", addressCountry: f.country };
  if (filled(f.city)) address.addressLocality = f.city as string;
  if (filled(f.address)) address.streetAddress = f.address as string;
  const place: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: f.canonical_name,
    url,
    description: facilityDescription(f, 300),
    address,
  };
  // Coordinates only when the record says they are exact; approximate points would mislead.
  if (f.location_precision === "exact" && f.latitude != null && f.longitude != null) {
    place.geo = { "@type": "GeoCoordinates", latitude: f.latitude, longitude: f.longitude };
  }
  if (filled(f.operator_name)) place.owner = { "@type": "Organization", name: f.operator_name };
  if (filled(f.website_url)) place.sameAs = [f.website_url];
  if (f.capacity_mw != null) {
    place.additionalProperty = [{ "@type": "PropertyValue", name: "Capacity", value: f.capacity_mw, unitText: "MW" }];
  }
  return [
    place,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Data center tracker", item: `${siteUrl}/data` },
        { "@type": "ListItem", position: 3, name: f.canonical_name, item: url },
      ],
    },
  ];
}
