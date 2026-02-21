import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Zap, Calendar, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DailyDigest = () => {
  const { data: digest, isLoading } = useQuery({
    queryKey: ["daily_digest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_digests")
        .select("*")
        .order("digest_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="border-b border-border bg-primary/[0.03]">
        <div className="container py-8 md:py-10">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </section>
    );
  }

  if (!digest) return null;

  return (
    <section className="border-b border-border bg-primary/[0.03]">
      <div className="container py-8 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-primary">
              Morning Intelligence Brief
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar size={12} />
            {format(new Date(digest.digest_date + "T00:00:00"), "MMMM d, yyyy")}
            <span className="text-border mx-1">|</span>
            <span>{digest.article_count} sources analyzed</span>
          </div>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none 
          [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:uppercase [&_h2]:tracking-[1px] [&_h2]:text-primary [&_h2]:mt-5 [&_h2]:mb-2
          [&_p]:text-[14px] [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_p]:mb-3
          [&_strong]:text-foreground
          [&_li]:text-[14px] [&_li]:leading-relaxed [&_li]:text-foreground/90
          [&_ul]:mb-3
        ">
          <ReactMarkdown>{digest.content}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
};

export default DailyDigest;
