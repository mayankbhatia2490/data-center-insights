import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NewsCard from "@/components/NewsCard";
import Sidebar from "@/components/Sidebar";
import { mockNews } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const visibleNews = mockNews.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      <main id="news" className="container py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold md:text-2xl">Latest Intelligence</h2>
          <div className="flex gap-2">
            {["All", "M&A", "AI", "Middle East"].map((filter) => (
              <button
                key={filter}
                className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                data-active={filter === "All"}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* News Feed */}
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {visibleNews.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
            {visibleCount < mockNews.length && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((c) => Math.min(c + 4, mockNews.length))}
                >
                  Load More Stories
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Data Center Pulse</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Data Center Pulse. Intelligence for infrastructure leaders.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
