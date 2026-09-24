import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const input = process.argv[2];
const requestedScope = process.argv[3] || "middle_east";
const dryRun = process.argv.includes("--dry-run");
if (!input) throw new Error("Usage: node scripts/import-data-centers.mjs <authorized-export.csv|geojson>");
if (process.env.DATASET_LICENSE_ACK !== "true") {
  throw new Error("Set DATASET_LICENSE_ACK=true only after confirming the export license permits this internal/public use.");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dryRun && (!supabaseUrl || !serviceKey)) throw new Error("VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const db = dryRun ? null : createClient(supabaseUrl, serviceKey);

const clean = (value) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};
const number = (value) => {
  const text = clean(value);
  if (!text) return null;
  const parsed = Number(String(text).replace(/,/g, "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
const first = (row, names) => {
  const key = Object.keys(row).find((candidate) => names.some((name) => candidate.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, "")));
  return key ? row[key] : null;
};
const csvRows = (text) => {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]; const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(value); value = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value); value = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = []; continue;
    }
    value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const [headers, ...data] = rows;
  return data.map((cells) => Object.fromEntries(headers.map((header, index) => [header.trim(), (cells[index] || "").trim()])));
};

const file = await fs.readFile(path.resolve(input), "utf8");
let rows;
if (input.toLowerCase().endsWith(".geojson") || input.toLowerCase().endsWith(".json")) {
  const geo = JSON.parse(file);
  const selected = Array.isArray(geo) ? geo : (Array.isArray(geo[requestedScope]) ? geo[requestedScope] : geo);
  const features = selected.type === "FeatureCollection" ? selected.features : Array.isArray(selected) ? selected.map((item) => ({ type: "Feature", properties: item, geometry: item.geometry })) : [{ type: "Feature", properties: selected.properties || selected, geometry: selected.geometry }];
  rows = features.map((feature) => ({ ...(feature.properties || {}), __longitude: feature.geometry?.coordinates?.[0] ?? feature.properties?.city_coords?.[1], __latitude: feature.geometry?.coordinates?.[1] ?? feature.properties?.city_coords?.[0] }));
} else rows = csvRows(file);
if (!rows.length) throw new Error("No records found in the export.");

if (dryRun) {
  const withCoordinates = rows.filter((row) => (row.city_coords && row.city_coords.length === 2) || first(row, ["Latitude", "lat"]));
  console.log(JSON.stringify({ ok: true, dry_run: true, scope: requestedScope, records_seen: rows.length, records_with_coordinates: withCoordinates.length }, null, 2));
  process.exit(0);
}

const lifecycle = (value) => {
  const normalized = (clean(value) || "unknown").toLowerCase().replace(/[- ]/g, "_");
  if (normalized.includes("operat")) return "operational";
  if (normalized.includes("construct")) return "under_construction";
  if (normalized.includes("planned") || normalized.includes("announced")) return "planned";
  if (normalized.includes("land")) return "land_banked";
  if (normalized.includes("decommission")) return "decommissioned";
  return "unknown";
};
const listingType = (value) => {
  const normalized = (clean(value) || "facility").toLowerCase();
  if (normalized.includes("campus")) return "campus";
  if (normalized.includes("building") || normalized.includes("multi")) return "multi_tenant_building";
  if (normalized.includes("land")) return "land";
  if (normalized.includes("portfolio")) return "portfolio";
  return "facility";
};
const precision = (latitude, longitude) => latitude != null && longitude != null ? "approximate" : "undisclosed";

let imported = 0; let rejected = 0;
for (const row of rows) {
  const name = clean(first(row, ["Data Center Name", "Facility Name", "Name", "canonical_name"]));
  const country = clean(first(row, ["Country", "country"]));
  if (!name || !country) { rejected += 1; continue; }
  const latitude = number(first(row, ["Latitude", "lat", "__latitude"]));
  const longitude = number(first(row, ["Longitude", "lon", "lng", "__longitude"]));
  const capacity = number(first(row, ["Fully Built-Out Power (MW)", "Fully Built Out Power", "Capacity MW", "capacity_mw"]));
  const externalId = clean(first(row, ["Data Center ID", "ID", "external_id"]));
  const rowData = {
    canonical_name: name,
    external_id: externalId,
    external_parent_id: clean(first(row, ["Parent ID", "parent_id", "external_parent_id"])),
    operator_name: clean(first(row, ["Company Name", "Operator", "operator_name"])),
    company_id: clean(first(row, ["Company ID", "company_id"])),
    profile_url: clean(first(row, ["URL to data center profile", "Profile URL", "profile_url"])),
    website_url: clean(first(row, ["URL to website", "Website URL", "website_url"])),
    listing_type: listingType(first(row, ["Listing Type", "listing_type"])),
    lifecycle_stage: lifecycle(first(row, ["Lifecycle Stage", "lifecycle_stage"])),
    service_types: clean(first(row, ["Services", "service_types"]))?.split(/[;,|]/).map((item) => item.trim()).filter(Boolean) || [],
    country,
    market: clean(first(row, ["Market", "market"])),
    city: clean(first(row, ["City", "city"])),
    state: clean(first(row, ["State", "state"])),
    postal: clean(first(row, ["Postal", "Postal Code", "postal"])),
    address: clean(first(row, ["Address", "address"])),
    address_details: clean(first(row, ["Address Details", "Address Details (suite/floor etc.)", "address_details"])),
    latitude,
    longitude,
    location_precision: precision(latitude, longitude),
    capacity_type: clean(first(row, ["Capacity Type", "capacity_type"])),
    capacity_mw: capacity,
    capacity_basis: capacity != null ? "fully_built_out_power" : "unknown",
    capacity_status: capacity != null ? "reported" : "not_disclosed",
    whitespace_sqm: number(first(row, ["Fully Built-Out Whitespace", "Fully Built Out Whitespace", "whitespace_sqm"])),
    total_building_size: number(first(row, ["Total Building Size", "total_building_size"])),
    year_operational: number(first(row, ["Year Operational", "year_operational"])),
    pue: number(first(row, ["PUE", "pue"])),
    site_code: clean(first(row, ["Site Code", "site_code"])),
    tier_design: clean(first(row, ["Tier Design", "tier_design"])),
    ecosystem_stats: (() => {
      const raw = clean(first(row, ["Ecosystem stats", "Ecosystem Stats", "ecosystem_stats"]));
      if (!raw) return {};
      try { return JSON.parse(raw); } catch { return { raw }; }
    })(),
    verification_status: "needs_review",
    verification_score: 0,
    last_verified_at: null,
  };
  const { data: facility, error } = await db.from("data_centers").upsert(rowData, { onConflict: "canonical_name,country" }).select("id").single();
  if (error) throw new Error(`${name}: ${error.message}`);
  const sourceUrl = clean(first(row, ["URL to data center profile", "Profile URL", "source_url"]));
  const sourceTitle = clean(first(row, ["Data Center Name", "Facility Name", "Name"]));
  const { error: sourceError } = await db.from("data_center_sources").insert({
    data_center_id: facility.id,
    source_url: sourceUrl,
    source_name: process.env.IMPORT_SOURCE_NAME || "ATLAS / Global Data Center Map",
    source_type: "manual_research",
    source_title: sourceTitle,
    evidence_excerpt: `Imported from authorized export row. Original ID: ${clean(first(row, ["Data Center ID", "ID", "id"])) || "not supplied"}.`,
    observed_capacity_mw: capacity,
    observed_lifecycle_stage: rowData.lifecycle_stage,
    automated_score: 0,
    review_status: "pending",
  });
  if (sourceError) throw new Error(`${name} source: ${sourceError.message}`);
  imported += 1;
}

console.log(JSON.stringify({ ok: true, input, records_seen: rows.length, imported, rejected, next_step: "Deploy verify-data-centers and review pending records." }, null, 2));
