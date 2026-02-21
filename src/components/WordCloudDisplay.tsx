import { useWordCloud } from "@/hooks/useIntelligence";
import { Skeleton } from "@/components/ui/skeleton";

const WordCloudDisplay = () => {
  const { data: words, isLoading } = useWordCloud();

  if (isLoading) {
    return (
      <div className="border-b border-border pb-8 mb-8">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    );
  }

  if (!words || words.length === 0) return null;

  const maxCount = Math.max(...words.map((w) => w.count || 1));

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
        Keyword Cloud
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w, i) => {
          const ratio = (w.count || 1) / maxCount;
          const fontSize = 10 + ratio * 14;
          const fontWeight = ratio > 0.6 ? 800 : ratio > 0.3 ? 600 : 400;
          return (
            <span
              key={w.word}
              className={`inline-block px-1.5 py-0.5 rounded-[2px] bg-secondary/30 ${colors[i % colors.length]} transition-colors hover:bg-primary/10`}
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

export default WordCloudDisplay;
