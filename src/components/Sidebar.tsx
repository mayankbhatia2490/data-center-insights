import { TrendingUp, TrendingDown, Calendar, ArrowRight, Hash } from "lucide-react";
import { trendingStories, marketTickers, upcomingEvents, categoryColors } from "@/data/mockData";

const Sidebar = () => {
  return (
    <aside className="space-y-6">
      {/* Trending Now */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Hash className="h-4 w-4 text-primary" />
          Trending Now
        </h3>
        <ol className="space-y-3">
          {trendingStories.map((story, i) => (
            <li key={story.id} className="group flex gap-3 cursor-pointer">
              <span className="text-2xl font-black text-muted-foreground/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug transition-colors group-hover:text-primary">
                  {story.title}
                </p>
                <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[1.5px] ${categoryColors[story.category]}`}>
                  {story.category}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Market Pulse */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Market Pulse
        </h3>
        <div className="space-y-3">
          {marketTickers.map((ticker) => (
            <div key={ticker.symbol} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
              <div>
                <p className="text-sm font-bold">{ticker.symbol}</p>
                <p className="text-xs text-muted-foreground">{ticker.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-semibold">${ticker.price}</p>
                <p className={`flex items-center justify-end gap-1 text-xs font-medium ${ticker.status === "up" ? "ticker-up" : "ticker-down"}`}>
                  {ticker.status === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {ticker.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div key={event.name} className="group cursor-pointer rounded-md border border-border/30 p-3 transition-colors hover:border-primary/30 hover:bg-secondary/30">
              <p className="text-sm font-semibold group-hover:text-primary">{event.name}</p>
              <p className="text-xs text-muted-foreground">{event.location}</p>
              <p className="mt-1 text-xs font-medium text-primary">{event.date}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
