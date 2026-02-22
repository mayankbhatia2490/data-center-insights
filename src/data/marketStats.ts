// Market Intelligence Data Service
// Structured for easy migration to Supabase API calls

export interface MetricCard {
  label: string;
  value: string;
  unit: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  subtitle?: string;
}

export interface BarChartDataPoint {
  name: string;
  shortName: string;
  capacity: number;
  color: string;
}

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

export interface DonutChart {
  title: string;
  subtitle: string;
  segments: DonutSegment[];
}

// ─── Top Banner Metrics ───────────────────────────────────────────
export const keyMetrics: MetricCard[] = [
  {
    label: "Global Capacity",
    value: "45",
    unit: "GW",
    trend: "+15%",
    trendDirection: "up",
    subtitle: "YoY growth",
  },
  {
    label: "Energy Consumption",
    value: "700",
    unit: "TWh",
    trend: "3.8%",
    trendDirection: "neutral",
    subtitle: "of global electricity",
  },
  {
    label: "Annual CapEx",
    value: "$600",
    unit: "B",
    trend: "+30%",
    trendDirection: "up",
    subtitle: "Hyperscale-driven",
  },
  {
    label: "Active Facilities",
    value: "10,978",
    unit: "",
    trend: "+8%",
    trendDirection: "up",
    subtitle: "Globally tracked",
  },
];

// ─── Main Bar Chart: Top Providers ───────────────────────────────
export const topProviders: BarChartDataPoint[] = [
  // --- Global Hyperscalers ---
  { name: "Nvidia", shortName: "Nvidia", capacity: 8, color: "hsl(var(--primary))" },
  { name: "Microsoft Azure", shortName: "Microsoft", capacity: 6.5, color: "hsl(210 80% 55%)" },
  { name: "Amazon Web Services", shortName: "AWS", capacity: 6, color: "hsl(142 60% 40%)" },
  { name: "Google Cloud", shortName: "Google", capacity: 5.5, color: "hsl(47 90% 50%)" },
  { name: "Equinix", shortName: "Equinix", capacity: 4.5, color: "hsl(280 55% 55%)" },
  // --- MENA Leaders ---
  { name: "G42", shortName: "G42", capacity: 4.2, color: "hsl(170 60% 40%)" },
  { name: "Khazna Data Centers", shortName: "Khazna", capacity: 3.9, color: "hsl(25 80% 50%)" },
  { name: "STC", shortName: "STC", capacity: 3.5, color: "hsl(220 70% 50%)" },
  { name: "e& (Etisalat)", shortName: "e&", capacity: 3.2, color: "hsl(160 55% 45%)" },
  { name: "Ooredoo", shortName: "Ooredoo", capacity: 2.8, color: "hsl(0 65% 50%)" },
  // --- Global Colocation ---
  { name: "Digital Realty", shortName: "Digital Realty", capacity: 3.8, color: "hsl(200 60% 45%)" },
  { name: "NTT Data", shortName: "NTT", capacity: 2.9, color: "hsl(340 55% 50%)" },
];

// ─── Secondary Donut Charts ──────────────────────────────────────
export const donutCharts: DonutChart[] = [
  {
    title: "Hyperscale vs Colocation",
    subtitle: "Global capacity share by model",
    segments: [
      { name: "Hyperscale", value: 44, color: "hsl(var(--primary))" },
      { name: "Colocation", value: 22, color: "hsl(210 80% 55%)" },
      { name: "On-Premise", value: 34, color: "hsl(var(--muted))" },
    ],
  },
  {
    title: "Regional Capacity Split",
    subtitle: "Global power distribution by region",
    segments: [
      { name: "United States", value: 48, color: "hsl(var(--primary))" },
      { name: "MENA", value: 12, color: "hsl(25 80% 50%)" },
      { name: "China", value: 15, color: "hsl(47 90% 50%)" },
      { name: "Europe", value: 14, color: "hsl(210 80% 55%)" },
      { name: "Rest of World", value: 11, color: "hsl(var(--muted))" },
    ],
  },
  {
    title: "AI Workload Power",
    subtitle: "Projected AI share of total DC load",
    segments: [
      { name: "AI Workloads", value: 38, color: "hsl(280 55% 55%)" },
      { name: "Standard", value: 62, color: "hsl(var(--muted))" },
    ],
  },
  {
    title: "MENA Capacity Breakdown",
    subtitle: "Regional split across the Middle East",
    segments: [
      { name: "UAE", value: 35, color: "hsl(25 80% 50%)" },
      { name: "Saudi Arabia", value: 28, color: "hsl(142 60% 40%)" },
      { name: "Qatar", value: 12, color: "hsl(210 80% 55%)" },
      { name: "Bahrain", value: 9, color: "hsl(340 55% 50%)" },
      { name: "Oman", value: 9, color: "hsl(47 90% 50%)" },
      { name: "Kuwait", value: 7, color: "hsl(280 55% 55%)" },
    ],
  },
];

// ─── Investment History ──────────────────────────────────────────
export const investmentHistory = [
  { year: 2021, amount: 222, growth: 12 },
  { year: 2022, amount: 256, growth: 15 },
  { year: 2023, amount: 302, growth: 18 },
  { year: 2024, amount: 368, growth: 22 },
  { year: 2025, amount: 460, growth: 25 },
  { year: 2026, amount: 600, growth: 30 },
];
