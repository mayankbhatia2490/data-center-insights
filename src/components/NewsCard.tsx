import { Article } from "../data/mockData";
import { Clock, ArrowUpRight } from "lucide-react";

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

const NewsCard = ({ article }: { article: Article }) => {
  return (
    <div
      className={`group flex flex-col md:flex-row gap-6 px-6 py-5 border-b border-border border-l-[3px] ${getCategoryBorder(article.category)} hover:bg-secondary transition-colors duration-200 cursor-pointer`}
    >
      <div className="w-full md:w-44 h-28 flex-shrink-0 overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-[1.5px] ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock size={11} /> {article.timestamp}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5 leading-snug group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm line-clamp-2">{article.summary}</p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {article.source}
          </span>
          <span className="text-xs text-muted-foreground">{article.readTime}</span>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
