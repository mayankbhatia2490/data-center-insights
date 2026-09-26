import Seo from "@/components/Seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import { Factory, Zap, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface DataCenterRow {
  id: string;
  canonical_name: string;
  operator_name: string | null;
  operators: string[];
  partners: string[];
  epcs: string[];
  contractors: string[];
  consultants: string[];
  country: string;
  city: string | null;
  lifecycle_stage: string;
  capacity_mw: number | null;
}

const matches = (name: string, value: string | null | undefined) =>
  (value || "").trim().toLowerCase() === name.trim().toLowerCase();

const matchesArray = (name: string, values: string[] | null | undefined) =>
  (values || []).some((v) => matches(name, v));

const ProjectRoleTable = ({ label, projects }: { label: string; projects: DataCenterRow[] }) => {
  if (projects.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4">{label}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
              <th className="text-left py-3 pr-4">Name</th>
              <th className="text-left py-3 pr-4 hidden md:table-cell">Location</th>
              <th className="text-left py-3 pr-4">Stage</th>
              <th className="text-right py-3">Capacity</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((dc) => (
              <tr key={dc.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-3 pr-4">
                  <Link
                    to={`/data-centers/${dc.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors no-underline"
                  >
                    {dc.canonical_name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                  {[dc.city, dc.country].filter(Boolean).join(", ")}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-[4px]">
                    {stageLabel[dc.lifecycle_stage] || dc.lifecycle_stage}
                  </span>
                </td>
                <td className="py-3 text-right font-mono text-xs font-bold text-foreground">
                  {dc.capacity_mw != null ? `${dc.capacity_mw} MW` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CompanyProfile = () => {
  const { name } = useParams<{ name: string }>();
  const companyName = decodeURIComponent(name || "");

  const { data: dataCenters, isLoading } = useQuery({
    queryKey: ["company-projects", companyName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_centers")
        .select("id, canonical_name, operator_name, operators, partners, epcs, contractors, consultants, country, city, lifecycle_stage, capacity_mw")
        .limit(1000);
      if (error) throw error;
      return (data || []) as DataCenterRow[];
    },
    enabled: !!companyName,
  });

  const asOperator = (dataCenters || []).filter(
    (dc) => matches(companyName, dc.operator_name) || matchesArray(companyName, dc.operators)
  );
  const asEpc = (dataCenters || []).filter((dc) => matchesArray(companyName, dc.epcs));
  const asContractor = (dataCenters || []).filter((dc) => matchesArray(companyName, dc.contractors));
  const asConsultant = (dataCenters || []).filter((dc) => matchesArray(companyName, dc.consultants));
  const asPartner = (dataCenters || []).filter((dc) => matchesArray(companyName, dc.partners));

  const totalProjects = new Set(
    [...asOperator, ...asEpc, ...asContractor, ...asConsultant, ...asPartner].map((dc) => dc.id)
  ).size;

  return (
    <div className="min-h-screen bg-background">
      {companyName && (
        <Seo
          title={`${companyName} — Data Center Pulse`}
          description={`${companyName} — data center projects tracked across the Middle East, by role (operator, EPC, contractor, consultant, partner).`}
          path={`/companies/${encodeURIComponent(companyName)}`}
          type="profile"
        />
      )}
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12 max-w-4xl">
        <Link to="/data-centers" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 no-underline">
          <ArrowLeft size={12} /> Back to Data Center Projects
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : totalProjects === 0 ? (
          <div className="text-center py-12">
            <Factory size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-muted-foreground">No tracked projects for "{companyName}"</p>
            <p className="text-sm text-muted-foreground mt-1">
              This company hasn't been linked to any project on Data Center Pulse yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Factory size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">{companyName}</h1>
                <p className="text-sm text-muted-foreground">
                  {totalProjects} tracked project{totalProjects !== 1 ? "s" : ""} across Data Center Pulse
                </p>
              </div>
            </div>

            <ProjectRoleTable label="Projects as Operator" projects={asOperator} />
            <ProjectRoleTable label="Projects as EPC" projects={asEpc} />
            <ProjectRoleTable label="Projects as Contractor" projects={asContractor} />
            <ProjectRoleTable label="Projects as Consultant" projects={asConsultant} />
            <ProjectRoleTable label="Projects as Partner" projects={asPartner} />
          </>
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

export default CompanyProfile;
