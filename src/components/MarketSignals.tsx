import { useSignals } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { TrendingUp, AlertTriangle, Lightbulb, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const typeConfig: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  trend: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  risk: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  opportunity: { icon: Lightbulb, color: "text-accent-foreground", bg: "bg-accent" },
};

const MarketSignals = () => {
  const { data: signals, isLoading } = useSignals(9);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <section className="container py-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </section>
    );
  }

  if (!signals || signals.length === 0) return null;

  return (
    <section className="container py-8">
      <h2 className="flex items-center gap-2 text-lg font-bold mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        Market Signals
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {signals.map((s) => {
          const config = typeConfig[s.type || "trend"] || typeConfig.trend;
          const Icon = config.icon;
          return (
            <div
              key={s.id}
              className="relative rounded-[4px] border border-border bg-card p-4 hover:border-primary/30 transition-colors duration-200 overflow-hidden"
            >
              <div className={s.locked ? "blur-[3px] select-none pointer-events-none" : undefined}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[1.5px] px-2 py-0.5 rounded-[2px] ${config.bg} ${config.color}`}>
                    <Icon size={10} />
                    {s.type}
                  </span>
                  {s.region && (
                    <span className="text-[10px] text-muted-foreground">{s.region}</span>
                  )}
                  <ConfidenceBadge tier={s.confidence_tier} sourceCount={s.source_article_ids?.length} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {s.locked ? "Subscribe to see the full analysis behind this signal." : s.reason}
                </p>
                {s.confidence !== null && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(s.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {Math.round((s.confidence || 0) * 100)}%
                    </span>
                  </div>
                )}
              </div>
              {s.locked && (
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
          );
        })}
      </div>
    </section>
  );
};

export default MarketSignals;
