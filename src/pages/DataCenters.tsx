import Seo from "@/components/Seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import { Link } from "react-router-dom";
import { Building2, Zap, ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const countryTabs = ["All", "United Arab Emirates", "Saudi Arabia", "Qatar", "Oman", "Bahrain", "Egypt", "Kuwait"];
const stageFilters = ["All", "operational", "under_construction", "announced", "planned", "on_hold"];

const stageLabel: Record<string, string> = {
  operational: "Operational",
  under_construction: "Under Construction",
  announced: "Announced",
  planned: "Planned",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  land_banked: "Land Banked",
  decommissioned: "Decommissioned",
  unknown: "Unknown",
};

const DataCenters = () => {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  const { data: dataCenters, isLoading } = useQuery({
    queryKey: ["data-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_centers")
        .select("id, canonical_name, country, city, lifecycle_stage, capacity_mw, full_ambition_mw, verification_status, data_center_companies(role, company:companies(name))")
        .order("capacity_mw", { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((dc) => ({
        ...dc,
        operator_name: dc.data_center_companies.find((l) => l.role === "operator")?.company?.name || null,
      }));
    },
  });

  const filtered = (dataCenters || []).filter((dc) => {
    const matchesSearch =
      !search ||
      dc.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
      (dc.operator_name || "").toLowerCase().includes(search.toLowerCase());

    const matchesCountry = countryFilter === "All" || dc.country === countryFilter;
    const matchesStage = stageFilter === "All" || dc.lifecycle_stage === stageFilter;

    return matchesSearch && matchesCountry && matchesStage;
  });

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Data Center Projects — Data Center Pulse"
        description="Tracked data center facilities and campuses across the Middle East — operators, capacity, lifecycle stage, and verification status."
        path="/data-centers"
      />
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 no-underline">
            <ArrowLeft size={12} /> Back to Pulse
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 size={24} className="text-primary" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">Data Center Projects</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Tracked GCC facilities and campuses — operators, capacity, and build stage.
          </p>
        </div>

        <div className="border-b border-border mb-6 overflow-x-auto">
          <div className="flex gap-0 -mb-px w-max">
            {countryTabs.map((c) => (
              <button
                key={c}
                onClick={() => setCountryFilter(c)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  countryFilter === c
                    ? "border-b-primary text-foreground"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-[4px]"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {stageFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`rounded-[4px] px-3 py-1 text-xs font-medium transition-colors ${
                  stageFilter === s
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {s === "All" ? "All" : stageLabel[s]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No projects found</p>
            <p className="text-sm mt-1">Try broadening your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4 hidden md:table-cell">Operator</th>
                  <th className="text-left py-3 pr-4 hidden lg:table-cell">Location</th>
                  <th className="text-left py-3 pr-4">Stage</th>
                  <th className="text-right py-3">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dc) => (
                  <tr key={dc.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link
                        to={`/data-centers/${dc.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors no-underline"
                      >
                        {dc.canonical_name}
                      </Link>
                      {dc.verification_status === "verified" && (
                        <ShieldCheck
                          size={12}
                          className="inline-block ml-1.5 text-accent align-text-bottom"
                          aria-label="Verified"
                        />
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{dc.operator_name || "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground hidden lg:table-cell">
                      {[dc.city, dc.country].filter(Boolean).join(", ")}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-[4px]">
                        {stageLabel[dc.lifecycle_stage] || dc.lifecycle_stage}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-xs font-bold text-foreground">
                      {dc.capacity_mw != null
                        ? `${dc.capacity_mw} MW`
                        : dc.full_ambition_mw != null
                        ? `~${dc.full_ambition_mw} MW (ambition)`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Data Center Pulse</span>
          </div>
          <span className="text-xs text-muted-foreground">© 2026 Data Center Pulse</span>
        </div>
      </footer>
    </div>
  );
};

export default DataCenters;
