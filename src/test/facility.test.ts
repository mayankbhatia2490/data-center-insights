import { describe, expect, it } from "vitest";
import {
  INDEX_THRESHOLD,
  buildFacilityJsonLd,
  capacityLabel,
  completeness,
  countrySlug,
  facilityDescription,
  facilityPath,
  facilityTitle,
  isIndexable,
  slugify,
  stageLabel,
  trackerStats,
  type Facility,
} from "@/lib/facility";

const base: Facility = {
  id: "f1",
  slug: "injazat-data-center",
  canonical_name: "Injazat Data Center",
  country: "United Arab Emirates",
  city: "Abu Dhabi",
  operator_name: "Injazat Data Systems",
  address: "8230 Mohammed Bin Zayed City",
  latitude: 24.3,
  longitude: 54.5,
  location_precision: "approximate",
  lifecycle_stage: "operational",
  capacity_mw: null,
  capacity_status: "not_disclosed",
  year_operational: null,
  estimated_energization: null,
  website_url: null,
  verification_status: "unverified",
  last_verified_at: null,
  listing_type: "facility",
  updated_at: "2026-09-30T00:00:00Z",
};

describe("facility indexing", () => {
  it("counts only fields that are actually filled", () => {
    // operator, city, address, coordinates, stage; no capacity, timeline, website, source, verification
    expect(completeness(base, 0)).toMatchObject({ score: 5, total: 10 });
    expect(completeness(base, 2).score).toBe(6);
  });

  it("treats an unknown stage, blank strings and null capacity as missing", () => {
    const thin: Facility = { ...base, operator_name: " ", city: "", address: null, latitude: null, lifecycle_stage: "unknown" };
    expect(completeness(thin, 0).score).toBe(0);
  });

  it("indexes only at or above the threshold", () => {
    expect(INDEX_THRESHOLD).toBe(5);
    expect(isIndexable(base, 0)).toBe(true);
    expect(isIndexable({ ...base, address: null }, 0)).toBe(false);
    expect(isIndexable({ ...base, address: null }, 1)).toBe(true);
  });

  it("never indexes a record that is not a facility", () => {
    expect(isIndexable({ ...base, listing_type: "campus" }, 5)).toBe(false);
  });
});

describe("facility text", () => {
  it("builds paths from country and slug", () => {
    expect(slugify("Côte d’Ivoire & Co.")).toBe("cote-d-ivoire-and-co");
    expect(countrySlug("United Arab Emirates")).toBe("united-arab-emirates");
    expect(facilityPath(base)).toBe("/data/facilities/united-arab-emirates/injazat-data-center");
  });

  it("says Not disclosed instead of guessing", () => {
    expect(capacityLabel(base)).toBe("Not disclosed");
    expect(capacityLabel({ capacity_mw: 40, capacity_status: "announced" })).toBe("40 MW (announced)");
    expect(stageLabel("unknown")).toBe("Not disclosed");
    expect(facilityDescription(base)).toContain("Capacity not disclosed");
  });

  it("keeps descriptions within the limit and titles free of duplicate city names", () => {
    expect(facilityDescription({ ...base, canonical_name: "X".repeat(300) }).length).toBeLessThanOrEqual(155);
    expect(facilityTitle(base)).toBe("Injazat Data Center, Abu Dhabi: capacity, status and history");
    expect(facilityTitle({ canonical_name: "Manama", city: "Manama" })).toBe("Manama: capacity, status and history");
  });
});

describe("facility structured data", () => {
  it("omits geo unless the location is exact and omits capacity when unknown", () => {
    const [place] = buildFacilityJsonLd(base, "https://example.com") as Record<string, unknown>[];
    expect(place["@type"]).toBe("Place");
    expect(place).not.toHaveProperty("geo");
    expect(place).not.toHaveProperty("additionalProperty");
    expect(place.url).toBe("https://example.com/data/facilities/united-arab-emirates/injazat-data-center");
  });

  it("includes geo and capacity when the record has them", () => {
    const [place] = buildFacilityJsonLd({ ...base, location_precision: "exact", capacity_mw: 12 }, "https://example.com") as Record<string, unknown>[];
    expect(place.geo).toEqual({ "@type": "GeoCoordinates", latitude: 24.3, longitude: 54.5 });
    expect(place.additionalProperty).toEqual([{ "@type": "PropertyValue", name: "Capacity", value: 12, unitText: "MW" }]);
  });
});

describe("tracker stats", () => {
  it("reports real counts, including zero verified", () => {
    const other: Facility = { ...base, id: "f2", slug: "b", country: "Qatar", latitude: null, longitude: null, lifecycle_stage: "unknown" };
    const s = trackerStats([base, other], { f1: 1 });
    expect(s).toMatchObject({ total: 2, countries: 2, withCoordinates: 1, withCapacity: 0, withSource: 1, verified: 0 });
    expect(s.byCountry[0][0]).toBe("United Arab Emirates");
  });
});
