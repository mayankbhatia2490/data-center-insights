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
          title: "Already on the list",
          description: data.message || "Check your inbox for the confirmation email.",
        });
        return { success: true, alreadySubscribed: true };
      }

      toast({
        title: "Almost there ⚡",
        description: "Check your email to confirm your subscription.",
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
