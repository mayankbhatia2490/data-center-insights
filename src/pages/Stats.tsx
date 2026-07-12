import Seo from "@/components/Seo";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { useStats } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";
import {
  keyMetrics,
  topProviders,
  donutCharts,
  investmentHistory,
  type BarChartDataPoint,
} from "@/data/marketStats";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(210 80% 55%)",
  "hsl(142 60% 40%)",
  "hsl(47 90% 50%)",
  "hsl(280 55% 55%)",
  "hsl(200 60% 45%)",
  "hsl(340 55% 50%)",
];

const TrendIcon = ({ direction }: { direction?: "up" | "down" | "neutral" }) => {
  if (direction === "up") return <TrendingUp size={13} />;
  if (direction === "down") return <TrendingDown size={13} />;
  return <Minus size={13} />;
};

const Stats = () => {
  const { data, isLoading } = useStats();
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  // Merge live DB data with static fallback
  const dbCompanies = data?.companies || [];
  const dbSegments = data?.segments || [];

  const providers: BarChartDataPoint[] = useMemo(() => {
    if (dbCompanies.length > 0) {
      return dbCompanies.map((c: any, i: number) => ({
        name: c.company,
        shortName: c.company?.replace(/ *\(.*\)/, "").split(" ").slice(0, 2).join(" "),
        capacity: c.total_capacity_gw,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
    }
    return topProviders;
  }, [dbCompanies]);

  // Build donut charts from DB segments, falling back to static data
  const liveDonutCharts = useMemo(() => {
    if (dbSegments.length === 0) return donutCharts;
    const chartMap = new Map<string, { title: string; subtitle: string; segments: { name: string; value: number; color: string }[] }>();
    for (const seg of dbSegments) {
      if (!chartMap.has(seg.chart_key)) {
        chartMap.set(seg.chart_key, { title: seg.chart_title, subtitle: seg.chart_subtitle || "", segments: [] });
      }
      chartMap.get(seg.chart_key)!.segments.push({
        name: seg.segment_name,
        value: Number(seg.segment_value),
        color: seg.segment_color || "hsl(var(--muted))",
      });
    }
    return Array.from(chartMap.values());
  }, [dbSegments]);

  const providerNames = useMemo(() => providers.map((p) => p.name), [providers]);
  const activeCompanies = selectedCompanies.size === 0 ? new Set(providerNames) : selectedCompanies;

  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) => {
      const current = prev.size === 0 ? new Set(providerNames) : new Set(prev);
      if (current.has(company)) current.delete(company);
      else current.add(company);
      if (current.size === providerNames.length) return new Set();
      return current;
    });
  };

  const filteredProviders = providers.filter((p) => activeCompanies.has(p.name));

  // Live metrics from DB with fallback
  const liveMetrics = useMemo(() => {
    const cap = data?.capacity?.[0];
    const energy = data?.energy?.[0];
    const inv = data?.investment?.[0];
    return keyMetrics.map((m) => {
      if (m.label === "Global Capacity" && cap) {
        return { ...m, value: String(cap.total_capacity_gw ?? m.value), trend: `+${cap.growth_rate_pct}%` };
      }
      if (m.label === "Energy Consumption" && energy) {
        return { ...m, value: String(energy.consumption_twh ?? m.value), trend: `${energy.percent_of_electricity}%` };
      }
      if (m.label === "Annual CapEx" && inv) {
        return { ...m, value: `$${inv.total_investment_usd ?? "600"}`, trend: `+${inv.growth_pct}%` };
      }
      return m;
    });
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Market Statistics — Data Center Pulse"
        description="Interactive data center market statistics — provider capacity, investment history, and regional MENA capacity splits visualized."
        path="/stats"
      />
      <Header />
      <main className="container py-6 md:py-10">
        {/* Page Header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black tracking-tight">Market Intelligence Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Live industry metrics · Updated from aggregated intelligence feeds
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            {/* ─── TOP BANNER: Key Metrics Strip ─────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {liveMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[4px] border border-border bg-card px-4 py-3"
                >
                  <span className="text-[9px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground block mb-1">
                    {metric.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-foreground leading-none">
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend && (
                      <span
                        className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                          metric.trendDirection === "up"
                            ? "text-green-500"
                            : metric.trendDirection === "down"
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        <TrendIcon direction={metric.trendDirection} />
                        {metric.trend}
                      </span>
                    )}
                    {metric.subtitle && (
                      <span className="text-[10px] text-muted-foreground">{metric.subtitle}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ─── MAIN CHART: Top Providers Bar Chart ───────────── */}
            <div className="rounded-[4px] border border-border bg-card p-5 mb-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <span className="w-[2px] h-4 bg-primary shrink-0" />
                    Top Providers by Capacity
                  </h2>
                  <p className="text-[10px] text-muted-foreground ml-3 mt-0.5">
                    Total power capacity in Gigawatts (GW)
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedCompanies(new Set())}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border transition-colors ${
                      selectedCompanies.size === 0
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {providers.map((p, idx) => {
                    const isActive = activeCompanies.has(p.name);
                    return (
                      <button
                        key={p.name}
                        onClick={() => toggleCompany(p.name)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border transition-colors flex items-center gap-1 ${
                          isActive
                            ? "border-foreground/20 text-foreground"
                            : "border-border text-muted-foreground/40"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-[1px] shrink-0"
                          style={{ backgroundColor: isActive ? CHART_COLORS[idx % CHART_COLORS.length] : "hsl(var(--muted))" }}
                        />
                        {p.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredProviders.map((p) => ({
                      name: p.shortName,
                      capacity: p.capacity,
                      fullName: p.name,
                      colorIdx: providerNames.indexOf(p.name),
                    }))}
                    margin={{ top: 5, right: 16, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "Inter" }}
                      angle={-40}
                      textAnchor="end"
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "Inter" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "GW",
                        angle: -90,
                        position: "insideLeft",
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                        fontFamily: "Inter",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 2,
                        fontSize: 11,
                        fontFamily: "Inter",
                        padding: "8px 12px",
                      }}
                      formatter={(value: number, _: any, entry: any) => [
                        `${value} GW`,
                        entry.payload.fullName,
                      ]}
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    />
                    <Bar dataKey="capacity" radius={[3, 3, 0, 0]} maxBarSize={48}>
                      {filteredProviders.map((p) => (
                        <Cell
                          key={p.name}
                          fill={CHART_COLORS[providerNames.indexOf(p.name) % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ─── SECONDARY CHARTS: 3-Column Donut Grid ─────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {liveDonutCharts.map((chart) => (
                <div
                  key={chart.title}
                  className="rounded-[4px] border border-border bg-card p-5"
                >
                  <h3 className="text-xs font-bold text-foreground mb-0.5">{chart.title}</h3>
                  <p className="text-[10px] text-muted-foreground mb-3">{chart.subtitle}</p>

                  <div className="flex items-center gap-4">
                    <div className="h-[120px] w-[120px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chart.segments}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={54}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                          >
                            {chart.segments.map((seg, i) => (
                              <Cell key={i} fill={seg.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 2,
                              fontSize: 10,
                              fontFamily: "Inter",
                            }}
                            formatter={(value: number) => [`${value}%`]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      {chart.segments.map((seg, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-[1px] shrink-0"
                              style={{ backgroundColor: seg.color }}
                            />
                            <span className="text-[11px] text-muted-foreground">{seg.name}</span>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-foreground">
                            {seg.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── INVESTMENT TREND LINE ──────────────────────────── */}
            <div className="rounded-[4px] border border-border bg-card p-5 mb-8">
              <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
                <span className="w-[2px] h-4 bg-primary shrink-0" />
                Annual CapEx Investment Trend
              </h2>
              <p className="text-[10px] text-muted-foreground ml-3 mb-4">
                Global data center investment in billions USD
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={investmentHistory}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "Inter" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "Inter" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "$B",
                        angle: -90,
                        position: "insideLeft",
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 2,
                        fontSize: 11,
                        fontFamily: "Inter",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "amount") return [`$${value}B`, "Investment"];
                        return [`${value}%`, "Growth"];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ─── Source Attribution ─────────────────────────────── */}
            <div className="text-[10px] text-muted-foreground/60 text-right">
              Illustrative estimates, not yet independently verified · Sourced, verified data coming soon
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex items-center justify-between py-5">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground no-underline">
            ← Back to Pulse
          </Link>
          <Link to="/intelligence" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-underline">
            Intelligence <ArrowRight size={12} />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Stats;
