import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const WordBubble = () => {
  const { data: words, isLoading } = useQuery({
    queryKey: ["word-bubble"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("word-bubble");
      if (error) throw error;
      return data as { word: string; count: number }[];
    },
    refetchInterval: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="border-b border-border pb-8 mb-8">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    );
  }

  if (!words || words.length === 0) return null;

  const maxCount = Math.max(...words.map((w) => w.count), 1);

  const colors = [
    "text-primary",
    "text-foreground",
    "text-muted-foreground",
    "text-accent-foreground",
    "text-primary/70",
  ];

  return (
    <div className="border-b border-border pb-8 mb-8">
      <h3 className="flex items-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
        <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
        Trending Topics
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {words.slice(0, 40).map((w, i) => {
          const ratio = w.count / maxCount;
          const fontSize = 11 + ratio * 16;
          const fontWeight = ratio > 0.6 ? 800 : ratio > 0.3 ? 600 : 400;
          return (
            <span
              key={w.word}
              className={`inline-block px-2 py-0.5 rounded-[2px] bg-secondary/30 ${colors[i % colors.length]} transition-colors hover:bg-primary/10`}
              style={{ fontSize: `${fontSize}px`, fontWeight }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default WordBubble;
