import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSubscribe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const subscribe = async (email: string, name?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscribe", {
        body: { email, name },
      });

      if (error) throw error;

      if (data?.already_subscribed) {
        toast({
          title: "Already subscribed!",
          description: "You're already on the list. Check your inbox.",
        });
        return { success: true, alreadySubscribed: true };
      }

      toast({
        title: "Welcome aboard! ⚡",
        description: "You'll receive the daily briefing every morning.",
      });
      return { success: true, alreadySubscribed: false };
    } catch (err) {
      console.error("Subscribe error:", err);
      toast({
        title: "Subscription failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return { success: false, alreadySubscribed: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { subscribe, isLoading };
};
