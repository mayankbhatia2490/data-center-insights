import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketTicker {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  change_percent: string | null;
  status: string | null;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  location: string | null;
  date_text: string | null;
  start_date: string | null;
  end_date: string | null;
  source_url: string | null;
  created_at: string;
}

export function useMarketTickers() {
  return useQuery({
    queryKey: ["market_tickers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_tickers")
        .select("*")
        .order("symbol");
      if (error) throw error;
      return data as MarketTicker[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data as Event[];
    },
    refetchInterval: 30 * 60 * 1000,
  });
}
