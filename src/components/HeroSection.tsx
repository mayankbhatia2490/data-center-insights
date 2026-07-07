import { useArticles, Article } from "@/hooks/useArticles";
import { Clock, BarChart3 } from "lucide-react";
import { stripHtml } from "@/lib/stripHtml";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case "M&A": return "text-primary";
    case "Sustainability": return "text-accent";
    case "AI": return "text-primary";
    case "Middle East": return "text-[hsl(35,92%,60%)]";
    case "Policy": return "text-muted-foreground";
    default: return "text-primary";
  }
};

const formatTime = (date: string | null) => {
  if (!date) return "";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
};

const HeroSection = () => {
  const { data: articles, isLoading } = useArticles(undefined, 5);
  const { data: allArticles } = useArticles(undefined, 50);

  const articleCount = allArticles?.length || 0;
  const latestDate = articles?.[0]?.published_at;

  if (isLoading || !articles?.length) {
    return (
      <section className="border-b border-border bg-card">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="lg:w-[60%] space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="lg:w-[40%] grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2 p-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const featured = articles[0];
  const secondaryStories = articles.slice(1, 5);

  return (
    <section className="border-b border-border bg-card">
      <div className="container py-8 md:py-12">
        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BarChart3 size={12} className="text-primary" />
            <span className="text-foreground font-semibold">{articleCount}</span> stories analyzed today
          </span>
          {latestDate && (
            <>
              <span className="text-border">|</span>
              <span>Last updated {formatTime(latestDate)}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-[60%]">
            <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-primary mb-4 block">
              Featured Story
            </span>
            <a href={featured.source_url || "#"} target="_blank" rel="noopener noreferrer" className="no-underline">
              <h1 className="text-[40px] md:text-[48px] font-black leading-[1.08] tracking-[-2px] text-foreground mb-4 hover:text-primary transition-colors">
                {featured.title}
              </h1>
            </a>
            <p className="text-[15px] leading-relaxed line-clamp-2 mb-6">
              {stripHtml(featured.summary)}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground uppercase tracking-wider">{featured.source}</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(featured.published_at)}</span>
              <span className="text-border">|</span>
              <span>{featured.read_time}</span>
            </div>
          </div>

          <div className="lg:w-[40%] grid grid-cols-2 border-l-0 lg:border-l border-border">
            {secondaryStories.map((story, i) => (
              <a
                key={story.id}
                href={story.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`group cursor-pointer px-4 lg:pl-6 py-4 hover:bg-secondary transition-colors duration-200 no-underline ${
                  i < 2 ? "border-b border-border" : ""
                } ${i % 2 === 0 ? "border-r border-border" : ""}`}
              >
                <span className={`text-[10px] font-extrabold uppercase tracking-[1.5px] ${getCategoryColor(story.category || "")}`}>
                  {story.category}
                </span>
                <h2 className="text-[14px] font-bold leading-snug mt-2 text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-3">
                  {story.title}
                </h2>
                <span className="text-[10px] text-muted-foreground mt-2 block">{formatTime(story.published_at)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
