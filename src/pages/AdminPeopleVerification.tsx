import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Check, X, EyeOff, ExternalLink } from "lucide-react";

// The generated Supabase types predate the verification tables; this narrow
// compatibility cast can be removed after regenerating database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type ReviewItem = {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
  person: { id: string; name: string; title: string | null; organization: string | null } | null;
  source: {
    id: string;
    source_url: string;
    source_name: string | null;
    source_title: string | null;
    evidence_excerpt: string | null;
    automated_score: number;
    checks: Record<string, boolean>;
  } | null;
};

const AdminPeopleVerification = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await db.from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: items, isLoading: queueLoading } = useQuery<ReviewItem[]>({
    queryKey: ["people-verification-queue"],
    queryFn: async () => {
      const { data, error } = await db
        .from("people_verification_queue")
        .select("id, status, reason, created_at, person:people(id, name, title, organization), source:people_verification_sources(id, source_url, source_name, source_title, evidence_excerpt, automated_score, checks)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ReviewItem[];
    },
    enabled: !!isAdmin,
  });

  const decide = async (item: ReviewItem, decision: "approved" | "rejected" | "dismissed") => {
    try {
      const { error: queueError } = await db.from("people_verification_queue").update({
        status: decision,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", item.id);
      if (queueError) throw queueError;

      if (item.person?.id && decision !== "dismissed") {
        const nextStatus = decision === "approved" ? "verified" : "rejected";
        const { error: personError } = await db.from("people").update({
          verification_status: nextStatus,
          verification_score: decision === "approved" ? Math.max(item.source?.automated_score || 0, 80) : item.source?.automated_score || 0,
          last_verified_at: new Date().toISOString(),
          verification_notes: decision === "approved" ? "Approved by a human reviewer after reviewing the cited source." : "Rejected by a human reviewer after reviewing the cited source.",
        }).eq("id", item.person.id);
        if (personError) throw personError;
      }

      await db.from("people_verification_audit").insert({
        person_id: item.person?.id,
        actor_type: "human",
        actor_id: user!.id,
        action: decision,
        to_status: decision === "approved" ? "verified" : decision === "rejected" ? "rejected" : "needs_review",
        score: item.source?.automated_score || 0,
        detail: { queue_id: item.id, source_url: item.source?.source_url },
      });

      toast({ title: decision === "approved" ? "Evidence approved" : decision === "rejected" ? "Evidence rejected" : "Review dismissed" });
      queryClient.invalidateQueries({ queryKey: ["people-verification-queue"] });
    } catch (error) {
      console.error("Verification decision error", error);
      toast({ title: "Could not save review", variant: "destructive" });
    }
  };

  if (authLoading || adminLoading) {
    return <div className="min-h-screen bg-background"><Header /><main className="container py-12"><Skeleton className="h-6 w-64" /></main></div>;
  }

  if (!user || !isAdmin) {
    return <div className="min-h-screen bg-background"><Seo title="People Verification — Admin" description="Admin review queue." path="/admin/people-verification" /><Header /><main className="container py-12 text-center text-muted-foreground"><ShieldCheck size={32} className="mx-auto mb-3 opacity-30" /><p className="text-lg font-semibold">Not authorized</p><p className="text-sm mt-1">This page is restricted to admin accounts.</p></main></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title="People Verification — Admin" description="Review automated evidence for leader profiles." path="/admin/people-verification" />
      <Header />
      <main className="container py-8 md:py-12 max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck size={24} className="text-primary" />
          <div><h1 className="text-2xl font-black tracking-tight">People Verification Queue</h1><p className="text-sm text-muted-foreground mt-1">Automation handles strong evidence; review only uncertain or conflicting records.</p></div>
        </div>
        {queueLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}</div> : !items?.length ? <p className="text-sm text-muted-foreground">No people waiting for review.</p> : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-[4px] border border-border bg-card p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold text-foreground">{item.person?.name || "Unknown person"}</h2>
                    <p className="text-sm text-muted-foreground">{item.person?.title}{item.person?.organization ? ` · ${item.person.organization}` : ""}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px] uppercase tracking-wider font-bold">
                      <span className="rounded bg-primary/10 text-primary px-2 py-1">Score {item.source?.automated_score ?? 0}/100</span>
                      {item.source?.checks?.source_reachable ? <span className="rounded bg-accent/10 text-accent px-2 py-1">Source reachable</span> : <span className="rounded bg-destructive/10 text-destructive px-2 py-1">Source unavailable</span>}
                      {item.source?.checks?.name_present && <span className="rounded bg-secondary text-muted-foreground px-2 py-1">Name found</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => decide(item, "dismissed")}><EyeOff size={14} className="mr-1" />Dismiss</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(item, "rejected")}><X size={14} className="mr-1" />Reject</Button>
                    <Button size="sm" onClick={() => decide(item, "approved")}><Check size={14} className="mr-1" />Approve</Button>
                  </div>
                </div>
                {item.source && <div className="mt-4 border-t border-border pt-3"><a href={item.source.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:text-primary inline-flex items-center gap-1">{item.source.source_title || item.source.source_name || item.source.source_url}<ExternalLink size={12} /></a>{item.source.evidence_excerpt && <p className="text-xs text-muted-foreground mt-2 italic">“{item.source.evidence_excerpt}”</p>}</div>}
                {item.reason && <p className="text-xs text-muted-foreground mt-3">{item.reason}</p>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPeopleVerification;
