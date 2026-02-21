import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { useStats } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Zap, Globe, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(210 80% 55%)",
  "hsl(142 76% 36%)",
  "hsl(47 96% 53%)",
  "hsl(280 65% 60%)",
];

const Stats = () => {
  const { data, isLoading } = useStats();
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const topCompanies = data?.companies || [];
  const allYears = useMemo(() => {
    const years = (data?.investment || []).map((i: any) => i.year).filter(Boolean) as number[];
    return [...new Set(years)].sort((a, b) => b - a);
  }, [data?.investment]);

  // Initialize selected companies to all on first load
  const companyNames = useMemo(() => topCompanies.map((c: any) => c.company as string), [topCompanies]);
  const activeCompanies = selectedCompanies.size === 0 ? new Set(companyNames) : selectedCompanies;

  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) => {
      const current = prev.size === 0 ? new Set(companyNames) : new Set(prev);
      if (current.has(company)) {
        current.delete(company);
      } else {
        current.add(company);
      }
      // If all are selected again, reset to empty (meaning "all")
      if (current.size === companyNames.length) return new Set();
      return current;
    });
  };

  const selectAllCompanies = () => setSelectedCompanies(new Set());

  const filteredCompanies = topCompanies.filter((c: any) => activeCompanies.has(c.company));

  const latestCapacity = data?.capacity?.[0];
  const latestEnergy = data?.energy?.[0];
  const activeYear = selectedYear ?? allYears[0] ?? null;
  const latestInvestment = activeYear
    ? (data?.investment || []).find((i: any) => i.year === activeYear)
    : data?.investment?.[0];

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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
                      Annual Investment
                    </span>
                  </div>
                  {allYears.length > 1 && (
                    <div className="flex gap-1">
                      {allYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors ${
                            activeYear === year
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
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

            {/* Top Companies with filter chips */}
            {topCompanies.length > 0 && (
              <div className="rounded-[4px] border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <span className="w-[2px] h-4 bg-primary shrink-0" />
                    Top Companies by Capacity
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={selectAllCompanies}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border transition-colors ${
                        selectedCompanies.size === 0
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      All
                    </button>
                    {companyNames.map((company, idx) => {
                      const shortName = company?.replace(/ *\(.*\)/, "").split(" ").slice(0, 2).join(" ");
                      const isActive = activeCompanies.has(company);
                      return (
                        <button
                          key={company}
                          onClick={() => toggleCompany(company)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border transition-colors flex items-center gap-1.5 ${
                            isActive
                              ? "border-foreground/30 text-foreground"
                              : "border-border text-muted-foreground/40 hover:text-muted-foreground hover:border-border"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-[2px] shrink-0"
                            style={{ backgroundColor: isActive ? CHART_COLORS[idx % CHART_COLORS.length] : "hsl(var(--muted))" }}
                          />
                          {shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredCompanies.map((c: any) => ({
                        name: c.company?.replace(/ *\(.*\)/, "").split(" ").slice(0, 2).join(" "),
                        capacity: c.total_capacity_gw,
                        fullName: c.company,
                        colorIdx: companyNames.indexOf(c.company),
                      }))}
                      margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        label={{ value: "GW", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                        formatter={(value: number, _: any, entry: any) => [
                          `${value} GW`,
                          entry.payload.fullName,
                        ]}
                      />
                      <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                        {filteredCompanies.map((c: any) => (
                          <Cell
                            key={c.company}
                            fill={CHART_COLORS[companyNames.indexOf(c.company) % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Growth Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {latestCapacity?.growth_rate_pct != null && (
                <div className="rounded-[4px] border border-border bg-card p-6 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-2">Capacity Growth</span>
                  <div className="h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ value: latestCapacity.growth_rate_pct }, { value: 100 - latestCapacity.growth_rate_pct }]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value">
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-2xl font-black -mt-4">{latestCapacity.growth_rate_pct}%</span>
                  <span className="text-xs text-muted-foreground">YoY Growth</span>
                </div>
              )}
              {latestInvestment?.growth_pct != null && (
                <div className="rounded-[4px] border border-border bg-card p-6 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-2">Investment Growth</span>
                  <div className="h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ value: latestInvestment.growth_pct }, { value: 100 - latestInvestment.growth_pct }]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value">
                          <Cell fill="hsl(142 76% 36%)" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-2xl font-black -mt-4">{latestInvestment.growth_pct}%</span>
                  <span className="text-xs text-muted-foreground">Growth ({latestInvestment.year})</span>
                </div>
              )}
              {latestEnergy?.percent_of_electricity != null && (
                <div className="rounded-[4px] border border-border bg-card p-6 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-2">Electricity Share</span>
                  <div className="h-[160px] w-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ value: latestEnergy.percent_of_electricity }, { value: 100 - latestEnergy.percent_of_electricity }]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value">
                          <Cell fill="hsl(47 96% 53%)" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-2xl font-black -mt-4">{latestEnergy.percent_of_electricity}%</span>
                  <span className="text-xs text-muted-foreground">of Global Electricity</span>
                </div>
              )}
            </div>

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
