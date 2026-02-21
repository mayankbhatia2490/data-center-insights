import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { donutCharts } from "@/data/marketStats";
import { ArrowRight } from "lucide-react";

const MarketGlance = () => {
  const chart = donutCharts[0]; // Hyperscale vs Colocation

  return (
    <section className="container py-8 md:py-10">
      <div className="rounded-[4px] border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="w-[2px] h-4 bg-primary shrink-0" />
              Market at a Glance
            </h3>
            <p className="text-[10px] uppercase tracking-[1.5px] text-muted-foreground mt-1 ml-3">
              {chart.subtitle}
            </p>
          </div>
          <Link
            to="/stats"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline no-underline"
          >
            Full Dashboard <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-center">
          <div className="h-[160px] w-[160px] mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chart.segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {chart.segments.map((seg, i) => (
                    <Cell key={i} fill={seg.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {chart.segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-sm text-foreground">{seg.name}</span>
                </div>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {seg.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketGlance;
