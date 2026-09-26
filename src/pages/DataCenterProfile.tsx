import Seo from "@/components/Seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import {
  Building2,
  Zap,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Thermometer,
  DollarSign,
  Flame,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

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

interface CompanyLink {
  id: string;
  name: string;
}

const CompanyRoleGroup = ({ label, companies }: { label: string; companies: CompanyLink[] }) => {
  if (!companies || companies.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {companies.map((company) => (
          <Link
            key={company.id}
            to={`/companies/${company.id}`}
            className="text-xs font-medium text-foreground bg-secondary hover:bg-primary/10 hover:text-primary transition-colors px-2.5 py-1 rounded-[4px] no-underline"
          >
            {company.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

const DataCenterProfile = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["data-center-profile", id],
    queryFn: async () => {
      const { data: dc, error } = await supabase
        .from("data_centers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;

      const { data: history } = await supabase
        .from("data_center_status_history")
        .select("id, lifecycle_stage, note, changed_at")
        .eq("data_center_id", id!)
        .order("changed_at", { ascending: false })
        .limit(20);

      const { data: sources } = await supabase
        .from("data_center_sources")
        .select("id, source_url, source_name, source_title, evidence_excerpt, created_at")
        .eq("data_center_id", id!)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: companyLinks } = await supabase
        .from("data_center_companies")
        .select("role, company:companies(id, name)")
        .eq("data_center_id", id!);

      return { dc, history: history || [], sources: sources || [], companyLinks: companyLinks || [] };
    },
    enabled: !!id,
  });

  const dc = data?.dc;
  const history = data?.history || [];
  const sources = data?.sources || [];
  const companyLinks = (data?.companyLinks || []) as unknown as { role: string; company: CompanyLink }[];
  const companiesByRole = (role: string) => companyLinks.filter((l) => l.role === role).map((l) => l.company);
  const hasAnyCompanies = companyLinks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {dc && (
        <Seo
          title={`${dc.canonical_name} — Data Center Pulse`}
          description={`${dc.canonical_name} — ${[dc.city, dc.country].filter(Boolean).join(", ")}. ${
            dc.capacity_mw ? `${dc.capacity_mw}MW` : "Capacity undisclosed"
          }, ${stageLabel[dc.lifecycle_stage] || dc.lifecycle_stage}.`}
          path={`/data-centers/${dc.id}`}
          type="article"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Place",
            name: dc.canonical_name,
            address: { "@type": "PostalAddress", addressLocality: dc.city || undefined, addressCountry: dc.country },
          }}
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
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : !dc ? (
          <div className="text-center py-12">
            <Building2 size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-muted-foreground">Project not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">{dc.canonical_name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-[4px]">
                  {stageLabel[dc.lifecycle_stage] || dc.lifecycle_stage}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {[dc.city, dc.market, dc.country].filter(Boolean).join(", ")}
              </p>
              {dc.aliases && dc.aliases.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Also known as: {dc.aliases.join(", ")}</p>
              )}
              {dc.verification_status === "verified" ? (
                <div className="inline-flex items-center gap-1 text-[11px] text-accent mt-2">
                  <ShieldCheck size={12} /> Evidence checked automatically · {dc.verification_score}/100
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
                  <AlertTriangle size={12} /> Evidence awaiting editorial review
                </div>
              )}
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="border border-border rounded-[4px] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Capacity</div>
                <div className="text-lg font-black text-foreground">{dc.capacity_mw != null ? `${dc.capacity_mw} MW` : "—"}</div>
              </div>
              <div className="border border-border rounded-[4px] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Full Ambition</div>
                <div className="text-lg font-black text-foreground">{dc.full_ambition_mw != null ? `${dc.full_ambition_mw} MW` : "—"}</div>
              </div>
              <div className="border border-border rounded-[4px] p-3">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <Flame size={10} /> Power Source
                </div>
                <div className="text-sm font-bold text-foreground capitalize">{dc.power_source || "Unknown"}</div>
              </div>
              <div className="border border-border rounded-[4px] p-3">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <Thermometer size={10} /> Cooling
                </div>
                <div className="text-sm font-bold text-foreground capitalize">{dc.cooling_type || "Unknown"}</div>
              </div>
            </div>

            {(dc.power_notes || dc.cooling_notes) && (
              <div className="mb-8 space-y-2 text-xs text-muted-foreground">
                {dc.power_notes && <p><span className="font-bold text-foreground">Power:</span> {dc.power_notes}</p>}
                {dc.cooling_notes && <p><span className="font-bold text-foreground">Cooling:</span> {dc.cooling_notes}</p>}
              </div>
            )}

            {(dc.investment_usd_m != null || dc.investment_notes) && (
              <div className="border border-border rounded-[4px] p-4 mb-8">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <DollarSign size={10} /> Investment
                </div>
                {dc.investment_usd_m != null && (
                  <div className="text-lg font-black text-foreground">${dc.investment_usd_m}M</div>
                )}
                {dc.investment_notes && <p className="text-xs text-muted-foreground mt-1">{dc.investment_notes}</p>}
              </div>
            )}

            {/* Companies Involved */}
            <h2 className="text-lg font-bold text-foreground mb-4">Companies Involved</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <CompanyRoleGroup label="Operator" companies={companiesByRole("operator")} />
              <CompanyRoleGroup label="EPC" companies={companiesByRole("epc")} />
              <CompanyRoleGroup label="Contractors" companies={companiesByRole("contractor")} />
              <CompanyRoleGroup label="Consultants" companies={companiesByRole("consultant")} />
              <CompanyRoleGroup label="Partners" companies={companiesByRole("partner")} />
            </div>
            {!hasAnyCompanies && (
              <p className="text-sm text-muted-foreground mb-8">No companies recorded for this project yet.</p>
            )}

            {/* Status History */}
            <h2 className="text-lg font-bold text-foreground mb-4">Status History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-8">No stage changes recorded yet.</p>
            ) : (
              <div className="space-y-0 mb-8">
                {history.map((h) => (
                  <div key={h.id} className="border-b border-border py-3 flex items-start gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-[4px] shrink-0">
                      {stageLabel[h.lifecycle_stage] || h.lifecycle_stage}
                    </span>
                    <div className="flex-1 min-w-0">
                      {h.note && <p className="text-xs text-foreground/80">{h.note}</p>}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sources */}
            <h2 className="text-lg font-bold text-foreground mb-4">Sources</h2>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sources recorded yet.</p>
            ) : (
              <div className="space-y-0">
                {sources.map((s) => (
                  <div key={s.id} className="border-b border-border py-4 flex flex-col md:flex-row md:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {s.source_url ? (
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors no-underline flex items-center gap-1"
                        >
                          {s.source_title || s.source_name}
                          <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{s.source_title || s.source_name}</span>
                      )}
                      {s.evidence_excerpt && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{s.evidence_excerpt}"</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{s.source_name}</span>
                        <span>{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default DataCenterProfile;
