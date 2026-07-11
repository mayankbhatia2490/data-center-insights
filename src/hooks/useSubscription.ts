import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useSubscription = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers")
        .select("subscription_tier, subscription_status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    isPremium: data?.subscription_tier === "premium",
    subscriptionStatus: data?.subscription_status ?? null,
    isLoading: !!user && isLoading,
  };
};
