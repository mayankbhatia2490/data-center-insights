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
      // Upcoming/ongoing only: ended events (or single-day ones already past)
      // must not crowd out newly fetched ones. Undated rows sort last.
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .or(
          `end_date.gte.${today},and(end_date.is.null,start_date.gte.${today}),and(end_date.is.null,start_date.is.null)`
        )
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(4);
      if (error) throw error;
      return data as Event[];
    },
    refetchInterval: 60 * 60 * 1000,
  });
}
