import { TrendingUp, TrendingDown } from "lucide-react";
import { trendingStories, marketTickers, upcomingEvents, categoryColors } from "@/data/mockData";

// Tiny inline sparkline SVGs (deterministic per symbol)
const sparklines: Record<string, string> = {
  EQIX: "M0,12 L4,10 L8,8 L12,9 L16,6 L20,4 L24,5 L28,3 L32,2",
  DLR: "M0,4 L4,5 L8,6 L12,4 L16,7 L20,9 L24,8 L28,10 L32,11",
  IRM: "M0,10 L4,9 L8,11 L12,8 L16,7 L20,6 L24,7 L28,5 L32,4",
  QTS: "M0,11 L4,9 L8,7 L12,8 L16,5 L20,4 L24,3 L28,4 L32,2",
};

const Sparkline = ({ symbol, status }: { symbol: string; status: string }) => (
  <svg width="32" height="14" viewBox="0 0 32 14" fill="none" className="inline-block">
    <path
      d={sparklines[symbol] || "M0,7 L32,7"}
      stroke={status === "up" ? "hsl(160,84%,39%)" : "hsl(0,84%,60%)"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case "M&A": return "text-primary";
    case "Sustainability": return "text-accent";
    case "AI": return "text-primary";
    case "Middle East": return "text-[hsl(35,92%,60%)]";
    default: return "text-muted-foreground";
  }
};

const Sidebar = () => {
  return (
    <aside className="space-y-0">
      {/* Market Pulse */}
      <div className="border-b border-border pb-6 mb-6">
        <h3 className="flex items-center gap-0 text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
          <span className="w-0.5 h-4 bg-primary mr-2 shrink-0" />
          Market Pulse
        </h3>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left font-semibold pb-2 uppercase tracking-wider">Symbol</th>
              <th className="text-right font-semibold pb-2 uppercase tracking-wider">Price</th>
              <th className="text-right font-semibold pb-2 uppercase tracking-wider">Chg</th>
              <th className="text-right font-semibold pb-2 uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
          <tbody>
            {marketTickers.map((ticker) => (
              <tr key={ticker.symbol} className="border-b border-border/50 last:border-0">
                <td className="py-2.5">
                  <span className="font-bold text-foreground text-xs">{ticker.symbol}</span>
                  <span className="block text-[10px] text-muted-foreground">{ticker.name}</span>
                </td>
                <td className="text-right font-mono text-xs text-foreground py-2.5">${ticker.price}</td>
                <td className={`text-right text-xs font-semibold py-2.5 ${ticker.status === "up" ? "text-accent" : "text-destructive"}`}>
                  {ticker.change}
                </td>
                <td className="text-right py-2.5 pl-2">
                  <Sparkline symbol={ticker.symbol} status={ticker.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trending Now */}
      <div className="border-b border-border pb-6 mb-6">
        <h3 className="flex items-center gap-0 text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
          <span className="w-0.5 h-4 bg-primary mr-2 shrink-0" />
          Trending Now
        </h3>
        <div className="space-y-3">
          {trendingStories.map((story, i) => (
            <div key={story.id} className="group cursor-pointer flex gap-2">
              <span className="text-[11px] font-bold text-primary shrink-0">
                {String(i + 1).padStart(2, "0")}&thinsp;/
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {story.title}
                </p>
                <span className={`text-[10px] font-extrabold uppercase tracking-[1.5px] mt-1 inline-block ${getCategoryColor(story.category)}`}>
                  {story.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events — horizontal timeline */}
      <div>
        <h3 className="flex items-center gap-0 text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
          <span className="w-0.5 h-4 bg-primary mr-2 shrink-0" />
          Upcoming Events
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-3 left-0 right-0 h-px bg-border" />
          <div className="flex justify-between gap-2">
            {upcomingEvents.map((event) => (
              <div key={event.name} className="relative flex-1 pt-5 group cursor-pointer">
                {/* Dot on timeline */}
                <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-primary uppercase">{event.date}</p>
                  <p className="text-[11px] font-semibold text-foreground mt-1 leading-tight group-hover:text-primary transition-colors">{event.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
