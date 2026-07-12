import { useRegionalOutlook } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { Globe2 } from "lucide-react";

const ScoreBar = ({ label, value, color }: { label: string; value: number | null; color: string }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-[1px]">{label}</span>
      <span className="text-[10px] font-mono text-muted-foreground">{value ?? "—"}</span>
    </div>
    <div className="h-1 bg-border rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value ?? 0}%` }} />
    </div>
  </div>
);

const RegionalOutlookSection = () => {
  const { data: outlooks, isLoading } = useRegionalOutlook();

  if (isLoading) {
    return (
      <section className="container py-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </section>
    );
  }

  if (!outlooks || outlooks.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
        <Globe2 className="h-5 w-5 text-primary" />
        Regional Outlook
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {outlooks.map((o) => (
          <div
            key={o.id}
            className="rounded-[4px] border border-border bg-card p-4 hover:border-primary/30 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">{o.region}</h3>
              <ConfidenceBadge tier={o.confidence_tier} sourceCount={o.source_article_ids?.length} />
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-3 line-clamp-4">
              {o.outlook}
            </p>
            <div className="space-y-2">
              <ScoreBar label="Demand" value={o.demand_score} color="bg-primary" />
              <ScoreBar label="Risk" value={o.risk_score} color="bg-destructive" />
              <ScoreBar label="Opportunity" value={o.opportunity_score} color="bg-accent-foreground" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RegionalOutlookSection;
