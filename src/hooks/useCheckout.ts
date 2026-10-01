import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {},
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Upgrade not available yet",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      if (err instanceof FunctionsHttpError && err.context.status === 501) {
        toast({
          title: "Upgrade not available yet",
          description: "Premium billing is not switched on yet. Please contact us to request access.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Couldn't start checkout",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { startCheckout, isLoading };
};
