import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Check, X } from "lucide-react";

interface PendingClaim {
  id: string;
  person_id: string;
  user_id: string;
  claim_email: string;
  created_at: string;
  people: { id: string; name: string; title: string | null; organization: string | null } | null;
}

const AdminClaims = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: adminCheckLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["pending-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_claims")
        .select("id, person_id, user_id, claim_email, created_at, people(id, name, title, organization)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as PendingClaim[];
    },
    enabled: !!isAdmin,
  });

  const decide = async (claim: PendingClaim, approve: boolean) => {
    try {
      const { error: claimError } = await supabase
        .from("profile_claims")
        .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", claim.id);
      if (claimError) throw claimError;

      if (approve) {
        const { error: personError } = await supabase
          .from("people")
          .update({ claimed_by: claim.user_id, claimed_at: new Date().toISOString() })
          .eq("id", claim.person_id);
        if (personError) throw personError;
      }

      toast({ title: approve ? "Claim approved" : "Claim rejected" });
      queryClient.invalidateQueries({ queryKey: ["pending-claims"] });
    } catch (err) {
      console.error("Claim decision error:", err);
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  if (authLoading || adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Skeleton className="h-6 w-48" />
        </main>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Admin — Data Center Pulse" description="Admin area." path="/admin/claims" />
        <Header />
        <main className="container py-12 text-center text-muted-foreground">
          <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">Not authorized</p>
          <p className="text-sm mt-1">This page is restricted to admin accounts.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Profile Claims — Admin" description="Review pending profile claims." path="/admin/claims" />
      <Header />
      <main className="container py-8 md:py-12">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck size={24} className="text-primary" />
          <h1 className="text-2xl font-black tracking-tight">Pending Profile Claims</h1>
        </div>

        {claimsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !claims || claims.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending claims.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-[4px] border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{c.people?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.people?.title}
                    {c.people?.organization ? ` · ${c.people.organization}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Claimed by {c.claim_email} on {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide(c, false)}>
                    <X size={14} className="mr-1" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => decide(c, true)}>
                    <Check size={14} className="mr-1" /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminClaims;
