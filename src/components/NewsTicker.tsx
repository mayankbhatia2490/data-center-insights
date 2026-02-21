import { useArticles } from "@/hooks/useArticles";
import { Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NewsTicker = () => {
  const { data: articles } = useArticles(undefined, 10);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hotIndex, setHotIndex] = useState(0);

  // Rotate the "HOT" tag every 8 seconds to a different article
  useEffect(() => {
    if (!articles || articles.length === 0) return;
    const interval = setInterval(() => {
      setHotIndex((prev) => (prev + 1) % Math.min(articles.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [articles]);

  if (!articles || articles.length === 0) return null;

  // Pick top 8 recent articles for the ticker
  const tickerItems = articles.slice(0, 8);

  return (
    <div className="w-full border-b border-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="container flex items-center h-9 gap-3">
        <span className="shrink-0 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[1.5px] text-destructive">
          <Flame size={12} className="animate-pulse" />
          Trending
        </span>
        <div className="relative flex-1 overflow-hidden h-full">
          <div
            ref={scrollRef}
            className="flex items-center gap-6 h-full animate-marquee whitespace-nowrap"
          >
            {[...tickerItems, ...tickerItems].map((article, i) => {
              const isHot = i % tickerItems.length === hotIndex;
              return (
                <a
                  key={`${article.id}-${i}`}
                  href={article.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200 no-underline shrink-0"
                >
                  {isHot && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-destructive/15 text-destructive text-[9px] font-extrabold uppercase tracking-wider">
                      🔥 HOT
                    </span>
                  )}
                  <span className="font-semibold text-foreground/80 max-w-[280px] truncate">
                    {article.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">·</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                    {article.category}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
