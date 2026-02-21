import { useArticles } from "@/hooks/useArticles";
import { useMarketTickers, useEvents } from "@/hooks/useSidebarData";
import { Skeleton } from "@/components/ui/skeleton";
import KeyPeopleSidebar from "@/components/KeyPeopleSidebar";
import WeeklyIndexWidget from "@/components/WeeklyIndexWidget";
import WordBubble from "@/components/WordBubble";

const Sparkline = ({ status }: { status: string | null }) => {
  // Generate a random-ish sparkline based on status
  const up = status === "up";
  const path = up
    ? "M0,12 L4,10 L8,8 L12,9 L16,6 L20,4 L24,5 L28,3 L32,2"
    : "M0,4 L4,5 L8,6 L12,4 L16,7 L20,9 L24,8 L28,10 L32,11";

  return (
    <svg width="32" height="14" viewBox="0 0 32 14" fill="none" className="inline-block">
      <path
        d={path}
        stroke={up ? "hsl(160,84%,39%)" : "hsl(0,84%,60%)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

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
  const { data: trendingArticles, isLoading: articlesLoading } = useArticles(undefined, 5);
  const { data: tickers, isLoading: tickersLoading } = useMarketTickers();
  const { data: events, isLoading: eventsLoading } = useEvents();

  // Fallback tickers when DB is empty (before first fetch)
  const fallbackTickers = [
    { symbol: "EQIX", name: "Equinix", price: 845.2, change_percent: "+1.2%", status: "up" },
    { symbol: "DLR", name: "Digital Realty", price: 132.5, change_percent: "-0.4%", status: "down" },
    { symbol: "IRM", name: "Iron Mountain", price: 76.8, change_percent: "+0.8%", status: "up" },
    { symbol: "QTS", name: "QTS Realty", price: 214.3, change_percent: "+2.1%", status: "up" },
  ];

  const displayTickers = tickers && tickers.length > 0 ? tickers : fallbackTickers;

  // Fallback events
  const fallbackEvents = [
    { name: "GITEX Global 2026", location: "Dubai World Trade Centre", date_text: "Oct 14-18" },
    { name: "Capacity Middle East", location: "Grand Hyatt Dubai", date_text: "Feb 06-08" },
    { name: "Data Center World", location: "London, UK", date_text: "Mar 12-13" },
  ];

  const displayEvents = events && events.length > 0 ? events : fallbackEvents;

  return (
    <aside className="space-y-0">
      <WeeklyIndexWidget />
      <KeyPeopleSidebar />
      <WordBubble />
      {/* Market Pulse */}
      <div className="border-b border-border pb-8 mb-8">
        <h3 className="flex items-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
          <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
          Market Pulse
          {tickers && tickers.length > 0 && (
            <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-muted-foreground/60">Live</span>
          )}
        </h3>
        {tickersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
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
              {displayTickers.map((ticker) => (
                <tr key={ticker.symbol} className="border-b border-border/50 last:border-0">
                  <td className="py-2">
                    <span className="font-bold text-foreground text-xs">{ticker.symbol}</span>
                    <span className="block text-[10px] text-muted-foreground">{ticker.name}</span>
                  </td>
                  <td className="text-right font-mono text-xs text-foreground py-2">
                    ${typeof ticker.price === "number" ? ticker.price.toFixed(2) : ticker.price}
                  </td>
                  <td className={`text-right text-xs font-semibold py-2 ${ticker.status === "up" ? "text-accent" : "text-destructive"}`}>
                    {ticker.change_percent}
                  </td>
                  <td className="text-right py-2 pl-2">
                    <Sparkline status={ticker.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Trending Now */}
      <div className="border-b border-border pb-8 mb-8">
        <h3 className="flex items-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
          <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
          Trending Now
        </h3>
        <div className="space-y-4">
          {articlesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-4 w-8 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : (
            (trendingArticles || []).map((story, i) => (
              <a key={story.id} href={story.source_url || "#"} target="_blank" rel="noopener noreferrer" className="group cursor-pointer flex gap-2 no-underline">
                <span className="text-[11px] font-bold text-primary shrink-0">
                  {String(i + 1).padStart(2, "0")}&thinsp;/
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-200">
                    {story.title}
                  </p>
                  <span className={`text-[10px] font-extrabold uppercase tracking-[1.5px] mt-1 inline-block ${getCategoryColor(story.category || "")}`}>
                    {story.category}
                  </span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="flex items-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
          <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
          Upcoming Events
        </h3>
        {eventsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-[10px] left-0 right-0 h-px bg-border" />
            <div className="flex justify-between gap-2">
              {displayEvents.map((event: any) => (
                <div key={event.name} className="relative flex-1 pt-6 group cursor-pointer">
                  <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform duration-200" />
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-primary uppercase">{event.date_text}</p>
                    <p className="text-[11px] font-semibold text-foreground mt-1 leading-tight group-hover:text-primary transition-colors duration-200">{event.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
