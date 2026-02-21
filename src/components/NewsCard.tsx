import { Clock, ArrowRight } from "lucide-react";
import type { Article } from "@/data/mockData";
import { categoryColors } from "@/data/mockData";

interface NewsCardProps {
  article: Article;
}

const NewsCard = ({ article }: NewsCardProps) => {
  return (
    <article className="group overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-border hover:shadow-lg hover:shadow-primary/5">
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${categoryColors[article.category]}`}>
            {article.category}
          </span>
          <span className="text-xs text-muted-foreground">{article.readTime}</span>
        </div>

        <h3 className="mb-2 text-base font-bold leading-snug transition-colors group-hover:text-primary md:text-lg">
          {article.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {article.summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{article.timestamp}</span>
            <span className="mx-1">·</span>
            <span>{article.source}</span>
          </div>

          <button className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Read Analysis <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
