import { mockNews } from "@/data/mockData";
import { Clock } from "lucide-react";

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case "M&A": return "text-primary";
    case "Sustainability": return "text-accent";
    case "AI": return "text-[hsl(270,70%,65%)]";
    case "Middle East": return "text-[hsl(35,92%,60%)]";
    case "Policy": return "text-[hsl(0,0%,70%)]";
    default: return "text-primary";
  }
};

const HeroSection = () => {
  const featured = mockNews[0];
  const secondaryStories = mockNews.slice(1, 5);

  return (
    <section className="border-b border-[#1e293b] bg-[hsl(222,47%,6%)]">
      <div className="container py-10 md:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Left: Featured Story (60%) */}
          <div className="lg:w-[60%]">
            <span className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-primary mb-3 block">
              Featured Story
            </span>
            <h1 className="text-[40px] md:text-[48px] font-black leading-[1.08] tracking-[-2px] text-foreground mb-4">
              {featured.title}
            </h1>
            <p className="text-[15px] leading-relaxed line-clamp-2 mb-5">
              {featured.summary}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground uppercase tracking-wider">{featured.source}</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {featured.timestamp}</span>
              <span className="text-border">|</span>
              <span>{featured.readTime}</span>
            </div>
          </div>

          {/* Right: 2x2 Grid of Top Stories (40%) */}
          <div className="lg:w-[40%] grid grid-cols-2 border-l-0 lg:border-l border-[#1e293b]">
            {secondaryStories.map((story, i) => (
              <div
                key={story.id}
                className={`group cursor-pointer px-4 lg:pl-6 py-4 hover:bg-secondary/30 transition-colors ${
                  i < 2 ? "border-b border-[#1e293b]" : ""
                } ${i % 2 === 0 ? "border-r border-[#1e293b]" : ""}`}
              >
                <span className={`text-[10px] font-extrabold uppercase tracking-[1.5px] ${getCategoryColor(story.category)}`}>
                  {story.category}
                </span>
                <h3 className="text-[14px] font-bold leading-snug mt-1.5 text-[hsl(210,40%,96%)] group-hover:text-primary transition-colors line-clamp-3">
                  {story.title}
                </h3>
                <span className="text-[10px] text-muted-foreground mt-2 block">{story.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
