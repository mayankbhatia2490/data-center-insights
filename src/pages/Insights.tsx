import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import EditorsPicks from "@/components/EditorsPicks";
import WordBubble from "@/components/WordBubble";
import WordCloudDisplay from "@/components/WordCloudDisplay";
import BottomSubscribeBar from "@/components/BottomSubscribeBar";
import NewsChatbot from "@/components/NewsChatbot";
import { Lightbulb } from "lucide-react";

const Insights = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <Lightbulb className="h-6 w-6 text-primary" />
            Insights & Trends
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated picks, trending topics, and keyword analysis.
          </p>
        </div>

        {/* Editor's Picks */}
        <EditorsPicks />

        {/* Trending Topics & Word Cloud side by side */}
        <div className="grid gap-8 lg:grid-cols-2 mt-8">
          <div className="border border-border bg-card rounded-[4px] p-6">
            <WordBubble />
          </div>
          <div className="border border-border bg-card rounded-[4px] p-6">
            <WordCloudDisplay />
          </div>
        </div>
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

export default Insights;
