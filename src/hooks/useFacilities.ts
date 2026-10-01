import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FACILITY_COLUMNS, countrySlug, type Facility } from "@/lib/facility";

export interface FacilitySource {
  id: string;
  source_name: string;
  source_title: string | null;
  source_type: string;
  source_url: string | null;
  review_status: string;
  checked_at: string | null;
}

export interface StatusChange {
  id: string;
  data_center_id: string;
  lifecycle_stage: string;
  note: string | null;
  changed_at: string;
}

export interface TrackerData {
  facilities: Facility[];
  sourceCounts: Record<string, number>;
  changes: StatusChange[];
}

export type FacilityResult =
  | { kind: "facility"; facility: Facility; sources: FacilitySource[]; history: StatusChange[]; sourceCount: number }
  | { kind: "moved"; country: string; slug: string }
  | { kind: "missing" };

// Whole tracker in three small reads (about 110 rows). Also used by the build-time pre-render,
// which fetches this once and seeds every facility page from it.
export async function fetchTrackerData(): Promise<TrackerData> {
  const [facilitiesRes, sourcesRes, historyRes] = await Promise.all([
    supabase.from("data_centers").select(FACILITY_COLUMNS).eq("listing_type", "facility").order("canonical_name").limit(2000),
    supabase.from("data_center_sources").select("data_center_id").limit(5000),
    supabase
      .from("data_center_status_history")
      .select("id, data_center_id, lifecycle_stage, note, changed_at")
      .order("changed_at", { ascending: false })
      .limit(200),
  ]);
  if (facilitiesRes.error) throw facilitiesRes.error;
  if (sourcesRes.error) throw sourcesRes.error;
  if (historyRes.error) throw historyRes.error;
  const sourceCounts: Record<string, number> = {};
  for (const s of sourcesRes.data ?? []) sourceCounts[s.data_center_id] = (sourceCounts[s.data_center_id] ?? 0) + 1;
  return { facilities: (facilitiesRes.data ?? []) as Facility[], sourceCounts, changes: (historyRes.data ?? []) as StatusChange[] };
}

export const trackerQueryOptions = queryOptions({ queryKey: ["tracker"], queryFn: fetchTrackerData });

export function useTracker() {
  return useQuery(trackerQueryOptions);
}

// Resolves a facility from the full tracker data. The detail page, the browser and the build all
// use this one function, so what the build writes is what the browser renders.
export function resolveFacility(
  data: TrackerData,
  country: string,
  slug: string,
  sources: FacilitySource[],
): FacilityResult {
  const facility = data.facilities.find((f) => f.slug === slug && countrySlug(f.country) === country);
  if (!facility) return { kind: "missing" };
  return {
    kind: "facility",
    facility,
    sources,
    history: data.changes.filter((c) => c.data_center_id === facility.id),
    sourceCount: data.sourceCounts[facility.id] ?? sources.length,
  };
}

export async function fetchFacilitySources(id: string): Promise<FacilitySource[]> {
  const { data, error } = await supabase
    .from("data_center_sources")
    .select("id, source_name, source_title, source_type, source_url, review_status, checked_at")
    .eq("data_center_id", id)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as FacilitySource[];
}

export const facilityQueryOptions = (country: string, slug: string) =>
  queryOptions({
    queryKey: ["facility", country, slug],
    queryFn: async (): Promise<FacilityResult> => {
      const { data: rows, error } = await supabase
        .from("data_centers")
        .select(FACILITY_COLUMNS)
        .eq("slug", slug)
        .eq("listing_type", "facility");
      if (error) throw error;
      const match = ((rows ?? []) as Facility[]).find((f) => countrySlug(f.country) === country);
      if (match) {
        const [sources, historyRes] = await Promise.all([
          fetchFacilitySources(match.id),
          supabase
            .from("data_center_status_history")
            .select("id, data_center_id, lifecycle_stage, note, changed_at")
            .eq("data_center_id", match.id)
            .order("changed_at", { ascending: false }),
        ]);
        if (historyRes.error) throw historyRes.error;
        return {
          kind: "facility",
          facility: match,
          sources,
          history: (historyRes.data ?? []) as StatusChange[],
          sourceCount: sources.length,
        };
      }

      // An old slug resolves through slug_history to the facility's current address.
      const { data: moved, error: movedError } = await supabase
        .from("slug_history")
        .select("entity_id")
        .eq("entity", "facility")
        .eq("old_slug", slug)
        .order("changed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (movedError) throw movedError;
      if (moved) {
        const { data: current } = await supabase
          .from("data_centers")
          .select("slug, country")
          .eq("id", moved.entity_id)
          .maybeSingle();
        if (current) return { kind: "moved", country: countrySlug(current.country), slug: current.slug };
      }
      return { kind: "missing" };
    },
  });

export function useFacility(country: string, slug: string) {
  return useQuery(facilityQueryOptions(country, slug));
}
