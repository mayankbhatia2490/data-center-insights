import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ConfidenceBadge from "@/components/ConfidenceBadge";

const WeeklyIndexWidget = ({ compact = false }: { compact?: boolean }) => {
  const { data: index, isLoading } = useQuery({
    queryKey: ["weekly-index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_index")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="border-b border-border pb-8 mb-8">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!index) return null;

  const ScoreIcon = index.score > 10 ? TrendingUp : index.score < -10 ? TrendingDown : Minus;
  const scoreColor = index.score > 10 ? "text-accent" : index.score < -10 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="border-b border-border pb-8 mb-8">
      <h3 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
        <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
        Pulse Index
        <ConfidenceBadge tier={index.confidence_tier} sourceCount={index.source_article_ids?.length} />
      </h3>

      <div className="flex items-center gap-3 mb-3">
        <div className={`text-3xl font-black ${scoreColor}`}>
          {index.score > 0 ? "+" : ""}{index.score}
        </div>
        <ScoreIcon size={20} className={scoreColor} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Weekly Sentiment
        </span>
      </div>

      {index.drivers && Array.isArray(index.drivers) && (
        <div className="mb-2">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Drivers</span>
          <ul className="mt-1 space-y-0.5">
            {(index.drivers as string[]).map((d, i) => (
              <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1">
                <TrendingUp size={10} className="text-accent mt-0.5 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {index.risks && Array.isArray(index.risks) && (
        <div className="mb-2">
          <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Risks</span>
          <ul className="mt-1 space-y-0.5">
            {(index.risks as string[]).map((r, i) => (
              <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1">
                <TrendingDown size={10} className="text-destructive mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {index.outlook && (
        <p className="text-[11px] text-muted-foreground mt-2 italic">
          {index.outlook}
        </p>
      )}
    </div>
  );
};

export default WeeklyIndexWidget;
