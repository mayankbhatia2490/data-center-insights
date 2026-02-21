import { Article } from "../data/mockData";
import { Clock, ArrowUpRight } from "lucide-react";

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case "Sustainability": return "text-accent bg-accent/10";
    case "AI": return "text-[hsl(270_70%_65%)] bg-[hsl(270_70%_60%/0.1)]";
    case "Middle East": return "text-[hsl(35_92%_60%)] bg-[hsl(35_92%_55%/0.1)]";
    default: return "text-primary bg-primary/10";
  }
};

const NewsCard = ({ article }: { article: Article }) => {
  return (
    <div className="group flex flex-col md:flex-row gap-6 p-6 border-b border-border/50 hover:bg-secondary/50 transition-all duration-300 cursor-pointer">
      <div className="w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock size={12} /> {article.timestamp}
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {article.summary}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Source: {article.source}
          </span>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Read Analysis <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
