import Header from "@/components/Header";
import { useStats } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Zap, Globe, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Stats = () => {
  const { data, isLoading } = useStats();

  const latestCapacity = data?.capacity?.[0];
  const latestEnergy = data?.energy?.[0];
  const latestInvestment = data?.investment?.[0];
  const topCompanies = data?.companies || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Industry Statistics
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-analyzed data center market statistics, updated monthly.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="rounded-[4px] border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
                    Global Capacity
                  </span>
                </div>
                <div className="text-3xl font-black text-foreground">
                  {latestCapacity?.total_capacity_gw ?? "—"} <span className="text-lg font-normal text-muted-foreground">GW</span>
                </div>
                {latestCapacity?.growth_rate_pct != null && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                    <TrendingUp size={14} />
                    {latestCapacity.growth_rate_pct}% YoY growth
                  </div>
                )}
              </div>

              <div className="rounded-[4px] border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
                    Energy Consumption
                  </span>
                </div>
                <div className="text-3xl font-black text-foreground">
                  {latestEnergy?.consumption_twh ?? "—"} <span className="text-lg font-normal text-muted-foreground">TWh</span>
                </div>
                {latestEnergy?.percent_of_electricity != null && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {latestEnergy.percent_of_electricity}% of global electricity
                  </p>
                )}
              </div>

              <div className="rounded-[4px] border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
                    Annual Investment
                  </span>
                </div>
                <div className="text-3xl font-black text-foreground">
                  ${latestInvestment?.total_investment_usd ?? "—"} <span className="text-lg font-normal text-muted-foreground">B</span>
                </div>
                {latestInvestment?.growth_pct != null && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                    <TrendingUp size={14} />
                    {latestInvestment.growth_pct}% growth ({latestInvestment.year})
                  </div>
                )}
              </div>
            </div>

            {/* Top Companies */}
            {topCompanies.length > 0 && (
              <div className="rounded-[4px] border border-border bg-card p-6">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <span className="w-[2px] h-4 bg-primary shrink-0" />
                  Top Companies by Capacity
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
                      <th className="text-left pb-2 font-semibold">Rank</th>
                      <th className="text-left pb-2 font-semibold">Company</th>
                      <th className="text-right pb-2 font-semibold">Capacity (GW)</th>
                      <th className="text-right pb-2 font-semibold">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCompanies.map((c: any) => (
                      <tr key={c.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2 text-muted-foreground font-mono text-xs">{c.rank}</td>
                        <td className="py-2 font-semibold text-foreground">{c.company}</td>
                        <td className="py-2 text-right font-mono">{c.total_capacity_gw}</td>
                        <td className="py-2 text-right text-muted-foreground">{c.region}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!latestCapacity && !latestEnergy && !latestInvestment && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-semibold">No statistics yet</p>
                <p className="text-sm mt-1">Stats will appear after the monthly fetch-stats function runs.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex items-center justify-between py-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground no-underline">
            ← Back to Pulse
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Stats;
