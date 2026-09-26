import { useStrategicInsights } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { Compass, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const horizonLabel: Record<string, string> = {
  "short-term": "Short-term",
  "medium-term": "Medium-term",
  "long-term": "Long-term",
};

const StrategicReadSection = () => {
  const { data: insights, isLoading } = useStrategicInsights(8);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <section className="container py-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </section>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="flex items-center gap-2 text-lg font-bold mb-2">
        <Compass className="h-5 w-5 text-primary" />
        Strategic Read
      </h2>
      <p className="text-[12px] text-muted-foreground mb-6">
        Analyst-style reasoning generated from this week's articles — interpretation, not verified fact.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((i) => (
          <div
            key={i.id}
            className="relative rounded-[4px] border border-border bg-card p-4 hover:border-primary/30 transition-colors duration-200 overflow-hidden"
          >
            <div className={i.locked ? "blur-[3px] select-none pointer-events-none" : undefined}>
              <div className="flex items-center gap-2 mb-2">
                {i.sector && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] px-2 py-0.5 rounded-[2px] bg-primary/10 text-primary">
                    {i.sector}
                  </span>
                )}
                {i.region && <span className="text-[10px] text-muted-foreground">{i.region}</span>}
                {i.horizon && (
                  <span className="text-[10px] text-muted-foreground">
                    {horizonLabel[i.horizon] || i.horizon}
                  </span>
                )}
                <ConfidenceBadge
                  tier={i.confidence_tier}
                  sourceCount={i.source_article_ids?.length}
                  className="ml-auto"
                />
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">
                {i.locked ? "Subscribe to read this week's full strategic read." : i.insight}
              </p>
            </div>
            {i.locked && (
              <Link
                to={user ? "/pricing" : "/login"}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-card/40 text-center no-underline"
              >
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-semibold text-foreground">
                  Subscribe to unlock
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default StrategicReadSection;
