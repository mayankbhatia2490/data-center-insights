import { Article } from "@/hooks/useArticles";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getCategoryBorder = (cat: string) => {
  switch (cat) {
    case "M&A": return "border-l-primary";
    case "Sustainability": return "border-l-accent";
    case "AI": return "border-l-primary";
    case "Middle East": return "border-l-[hsl(35,92%,55%)]";
    case "Policy": return "border-l-muted-foreground";
    default: return "border-l-primary";
  }
};

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

const NewsCard = ({ article, isFirst = false }: { article: Article; isFirst?: boolean }) => {
  return (
    <a
      href={article.source_url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col md:flex-row gap-6 px-6 py-6 border-b border-border border-l-[3px] ${getCategoryBorder(article.category || "")} hover:bg-secondary transition-colors duration-200 cursor-pointer no-underline`}
    >
      {article.image_url && (
        <div className="w-full md:w-44 h-28 flex-shrink-0 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-200"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isFirst && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-destructive/15 text-destructive text-[10px] font-extrabold uppercase tracking-[1px]">
                Breaking
              </span>
            )}
            <span className={`text-[10px] font-extrabold uppercase tracking-[1.5px] ${getCategoryColor(article.category || "")}`}>
              {article.category}
            </span>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock size={11} /> {formatTime(article.published_at)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors duration-200">
            {article.title}
          </h3>
          <p className="text-sm line-clamp-2">{article.summary}</p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {article.source}
          </span>
          <span className="text-xs text-muted-foreground">{article.read_time}</span>
        </div>
      </div>
    </a>
  );
};

export default NewsCard;
