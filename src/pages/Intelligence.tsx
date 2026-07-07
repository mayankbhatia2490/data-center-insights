import Seo from "@/components/Seo";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import WeeklyIndexWidget from "@/components/WeeklyIndexWidget";
import MarketSignals from "@/components/MarketSignals";
import BottomSubscribeBar from "@/components/BottomSubscribeBar";
import NewsChatbot from "@/components/NewsChatbot";
import { BarChart3 } from "lucide-react";

const Intelligence = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <BarChart3 className="h-6 w-6 text-primary" />
            Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Weekly sentiment, emerging signals, and market outlook.
          </p>
        </div>

        {/* Pulse Index — full width card */}
        <div className="border border-border bg-card rounded-[4px] p-6 mb-8">
          <WeeklyIndexWidget />
        </div>

        {/* Market Signals */}
        <MarketSignals />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <span className="text-sm font-semibold text-foreground">Data Center Pulse</span>
          <span className="text-xs text-muted-foreground">© 2026 Data Center Pulse. Intelligence for infrastructure leaders.</span>
        </div>
      </footer>

      <BottomSubscribeBar />
      <NewsChatbot />
    </div>
  );
};

export default Intelligence;
