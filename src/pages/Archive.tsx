import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, ArrowLeft, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

const Archive = () => {
  const { data: digests, isLoading } = useQuery({
    queryKey: ["digests-archive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_digests")
        .select("*")
        .order("digest_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Briefing Archive — Data Center Pulse"
        description="Browse past daily AI-generated intelligence briefings on MENA and global data center M&A, AI infrastructure, and sustainability."
        path="/archive"
      />
      <header className="sticky top-0 z-50 h-16 bg-card border-b-2 border-b-primary">
        <div className="container h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">
              Data Center <span className="text-primary">Pulse</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
            <ArrowLeft size={14} /> Back to Live Feed
          </Link>
        </div>
      </header>

      <main className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-black mb-2">Briefing Archive</h1>
        <p className="text-muted-foreground mb-8">Browse past daily AI-generated intelligence briefings.</p>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-border p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !digests?.length ? (
          <p className="text-center text-muted-foreground py-12">No briefings available yet.</p>
        ) : (
          <div className="space-y-6">
            {digests.map((digest) => (
              <details
                key={digest.id}
                className="group border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-bold">
                      {new Date(digest.digest_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {digest.article_count} articles analyzed
                  </span>
                </summary>
                <div className="px-6 pb-6 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{digest.content}</ReactMarkdown>
                </div>
              </details>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Archive;
