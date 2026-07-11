import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useClaimProfile = (personId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingClaim, refetch } = useQuery({
    queryKey: ["profile-claim", personId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_claims")
        .select("status")
        .eq("person_id", personId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitClaim = async () => {
    if (!user?.email) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("profile_claims").insert({
        person_id: personId,
        user_id: user.id,
        claim_email: user.email,
      });
      if (error) throw error;
      toast({
        title: "Claim submitted",
        description: "We'll verify and get back to you shortly.",
      });
      refetch();
    } catch (err) {
      console.error("Claim profile error:", err);
      toast({
        title: "Couldn't submit claim",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { existingClaim, submitClaim, isSubmitting };
};
