import Seo from "@/components/Seo";
import SiteFooter from "@/components/SiteFooter";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import WeeklyIndexWidget from "@/components/WeeklyIndexWidget";
import MarketSignals from "@/components/MarketSignals";
import RegionalOutlookSection from "@/components/RegionalOutlookSection";
import PremiumGate from "@/components/PremiumGate";
import BottomSubscribeBar from "@/components/BottomSubscribeBar";
import NewsChatbot from "@/components/NewsChatbot";
import { BarChart3 } from "lucide-react";

const Intelligence = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <Seo
        title="Market Intelligence — Data Center Pulse"
        description="Evidence-gated data center developments, source-backed signals, and regional outlook for MENA infrastructure decision-makers."
        path="/intelligence"
      />
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-[-0.01em]">
            <BarChart3 className="h-6 w-6 text-primary" />
            Market Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evidence-gated developments and regional signals. AI-assisted interpretations remain clearly marked until reviewed.
          </p>
        </div>

        {/* Pulse Index — full width card */}
        <div className="border border-border bg-card rounded-[4px] p-6 mb-8">
          <WeeklyIndexWidget />
        </div>

        {/* Market Signals + Regional Outlook — premium tier */}
        <PremiumGate
          title="Market Signals is a premium feature"
          description="Source-backed risk and opportunity signals across MENA data center markets. AI-assisted candidates remain in review until corroborated — available to Premium subscribers."
        >
          <MarketSignals />
          <RegionalOutlookSection />
        </PremiumGate>
      </main>

      <SiteFooter />

      <BottomSubscribeBar />
      <NewsChatbot />
    </div>
  );
};

export default Intelligence;
