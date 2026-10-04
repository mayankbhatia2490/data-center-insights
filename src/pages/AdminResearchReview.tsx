import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Check, X, Minus, ExternalLink, FileSearch, AlertTriangle } from "lucide-react";
import { useState } from "react";

type ReviewTask = {
  id: string;
  claim_id: string;
  priority: number;
  reason: string;
  created_at: string;
  research_claims: {
    id: string;
    field_name: string;
    proposed_value: unknown;
    evidence_excerpt: string;
    extraction_confidence: number;
    validation_status: string;
    source_documents: { source_url: string; source_name: string | null; title: string | null; published_at: string | null } | null;
    data_centers: { canonical_name: string; country: string; city: string | null; capacity_mw: number | null; lifecycle_stage: string } | null;
  } | null;
};

const AdminResearchReview = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => { const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle(); return !!data; },
    enabled: !!user,
  });
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["research-review-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_review_tasks" as never).select("id,claim_id,priority,reason,created_at,research_claims(id,field_name,proposed_value,evidence_excerpt,extraction_confidence,validation_status,source_documents(source_url,source_name,title,published_at),data_centers(canonical_name,country,city,capacity_mw,lifecycle_stage))").eq("status", "pending").order("priority", { ascending: false }).order("created_at", { ascending: true }).limit(100);
      if (error) throw error;
      return (data || []) as ReviewTask[];
    },
    enabled: !!isAdmin,
  });
  const decide = async (task: ReviewTask, decision: "approve" | "reject" | "dismiss") => {
    try {
      const { error } = await supabase.functions.invoke("review-research-claim", { body: { claim_id: task.claim_id, decision, notes: notes[task.id] || null } });
      if (error) throw error;
      toast({ title: decision === "approve" ? "Observation approved" : `Claim ${decision}ed` });
      queryClient.invalidateQueries({ queryKey: ["research-review-tasks"] });
    } catch (error) { console.error(error); toast({ title: "Could not save review decision", variant: "destructive" }); }
  };
  if (authLoading || adminLoading) return <><Header /><main className="container py-12"><Skeleton className="h-8 w-72" /></main></>;
  if (!user || !isAdmin) return <><Seo title="Research Review — Admin" description="Restricted research review queue." path="/admin/research-review" noindex /><Header /><main className="container py-16 text-center"><ShieldCheck className="mx-auto mb-3 text-primary" /><h1 className="text-xl font-semibold">Not authorized</h1><p className="mt-1 text-sm text-muted-foreground">This evidence review queue is restricted to admins.</p></main></>;
  return <div className="min-h-screen bg-background"><Seo title="Evidence Review — Admin" description="Review field-level data-center claims and evidence." path="/admin/research-review" noindex /><Header /><main className="container py-8 md:py-12">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"><FileSearch size={15} /> Evidence queue</div><h1 className="text-3xl font-semibold tracking-tight">Research review</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Approve facts only when the evidence excerpt supports the exact field. Approval creates an immutable observation and updates the current facility record.</p></div><div className="rounded border border-primary/20 bg-primary/5 px-4 py-3 text-sm"><span className="font-semibold text-primary">{tasks?.length ?? 0}</span> pending tasks</div></div>
    {isLoading ? <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-56 w-full" />)}</div> : !tasks?.length ? <div className="rounded border border-dashed border-border p-12 text-center text-sm text-muted-foreground"><Check className="mx-auto mb-3 text-primary" />No pending evidence claims.</div> : <div className="space-y-5">{tasks.map((task) => { const claim = task.research_claims; const dc = claim?.data_centers; const source = claim?.source_documents; if (!claim) return null; return <article key={task.id} className="rounded border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">{claim.field_name.replaceAll("_", " ")}</span><span className="text-xs text-muted-foreground">Priority {task.priority}</span>{claim.validation_status !== "passed" && <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertTriangle size={13} /> Needs caution</span>}</div><h2 className="mt-3 text-lg font-semibold">{dc?.canonical_name || "Unmatched facility"}</h2><p className="text-xs text-muted-foreground">{dc?.city ? `${dc.city}, ` : ""}{dc?.country || "Unknown country"} · Current: {claim.field_name === "capacity_mw" ? (dc?.capacity_mw ? `${dc.capacity_mw} MW` : "not disclosed") : dc?.lifecycle_stage || "unknown"}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Proposed value</p><p className="text-xl font-semibold text-primary">{String(claim.proposed_value)}{claim.field_name.includes("capacity") ? " MW" : ""}</p><p className="text-xs text-muted-foreground">Confidence {claim.extraction_confidence}/100</p></div></div><div className="mt-5 rounded bg-muted/50 p-4"><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Evidence excerpt</p><p className="text-sm leading-6">“{claim.evidence_excerpt}”</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{source?.source_name || "Source document"}{source?.published_at ? ` · ${new Date(source.published_at).toLocaleDateString()}` : ""}{source?.source_url && <a href={source.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Open source <ExternalLink size={12} /></a>}</div></div><p className="mt-3 text-xs text-muted-foreground">{task.reason}</p><Textarea value={notes[task.id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [task.id]: e.target.value }))} placeholder="Optional reviewer note" className="mt-3 min-h-16 bg-background" /><div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => decide(task, "dismiss")}><Minus size={14} className="mr-1" />Dismiss</Button><Button variant="outline" size="sm" onClick={() => decide(task, "reject")}><X size={14} className="mr-1" />Reject</Button><Button size="sm" onClick={() => decide(task, "approve")}><Check size={14} className="mr-1" />Approve observation</Button></div></article>; })}</div>}
  </main></div>;
};
export default AdminResearchReview;
