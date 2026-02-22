import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketSignal {
  id: string;
  type: string | null;
  title: string | null;
  region: string | null;
  reason: string | null;
  confidence: number | null;
  created_at: string | null;
}

export function useSignals(limit = 20) {
  return useQuery({
    queryKey: ["market-signals", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as MarketSignal[];
    },
    refetchInterval: 10 * 60 * 1000,
  });
}

export interface RegionalOutlook {
  id: string;
  region: string | null;
  outlook: string | null;
  demand_score: number | null;
  risk_score: number | null;
  opportunity_score: number | null;
  updated_at: string | null;
}

export function useRegionalOutlook() {
  return useQuery({
    queryKey: ["regional-outlook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regional_outlook")
        .select("*")
        .order("region");
      if (error) throw error;
      return data as RegionalOutlook[];
    },
    refetchInterval: 30 * 60 * 1000,
  });
}

export interface StrategicInsight {
  id: string;
  insight: string | null;
  sector: string | null;
  region: string | null;
  horizon: string | null;
  created_at: string | null;
}

export function useStrategicInsights(limit = 10) {
  return useQuery({
    queryKey: ["strategic-insights", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as StrategicInsight[];
    },
    refetchInterval: 30 * 60 * 1000,
  });
}

export interface WordCloudItem {
  word: string;
  count: number | null;
  last_updated: string | null;
}

export function useWordCloud() {
  return useQuery({
    queryKey: ["word-cloud-table"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("word_cloud")
        .select("*")
        .order("count", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as WordCloudItem[];
    },
    refetchInterval: 10 * 60 * 1000,
  });
}

export interface CapacityStat {
  id: string;
  region: string | null;
  total_capacity_gw: number | null;
  growth_rate_pct: number | null;
  last_updated: string | null;
  source: string | null;
}

export interface EnergyStat {
  id: string;
  region: string | null;
  consumption_twh: number | null;
  percent_of_electricity: number | null;
  last_updated: string | null;
  source: string | null;
}

export interface InvestmentStat {
  id: string;
  year: number | null;
  total_investment_usd: number | null;
  growth_pct: number | null;
  source: string | null;
}

export function useStats() {
  return useQuery({
    queryKey: ["dc-stats"],
    queryFn: async () => {
      const [capacityRes, energyRes, investmentRes, companyRes] = await Promise.all([
        supabase.from("dc_capacity_stats").select("*").order("last_updated", { ascending: false }).limit(5),
        supabase.from("dc_energy_usage").select("*").order("last_updated", { ascending: false }).limit(5),
        supabase.from("dc_investment_stats").select("*").order("year", { ascending: false }).limit(5),
        supabase.from("dc_company_capacity_stats").select("*").order("rank").limit(15),
      ]);
      return {
        capacity: capacityRes.data || [],
        energy: energyRes.data || [],
        investment: investmentRes.data || [],
        companies: companyRes.data || [],
      };
    },
    refetchInterval: 60 * 60 * 1000,
  });
}
