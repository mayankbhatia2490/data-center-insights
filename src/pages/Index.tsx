import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BottomSubscribeBar from "@/components/BottomSubscribeBar";
import NewsCard from "@/components/NewsCard";
import Sidebar from "@/components/Sidebar";
import { mockNews } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Zap, Mail, X, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const visibleNews = mockNews.slice(0, visibleCount);
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalSubscribed, setModalSubscribed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleModalSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalEmail) {
      setModalSubscribed(true);
      setTimeout(() => setShowModal(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />
      <HeroSection />

      <main id="news" className="container py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Latest Briefing
          </h2>
          <div className="flex gap-2">
            {["All", "M&A", "AI", "Middle East"].map((filter) => (
              <button
                key={filter}
                className="rounded-[4px] px-3 py-1 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                data-active={filter === "All"}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {visibleNews.map((article, i) => (
              <NewsCard key={article.id} article={article} isFirst={i === 0} />
            ))}
            {visibleCount < mockNews.length && (
              <div className="flex justify-center py-8">
                <button
                  onClick={() => setVisibleCount((c) => Math.min(c + 4, mockNews.length))}
                  className="text-muted-foreground hover:text-foreground font-medium border-b border-border pb-1 hover:border-foreground transition-all duration-200 text-sm"
                >
                  Load previous days
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Data Center Pulse</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Data Center Pulse. Intelligence for infrastructure leaders.
          </p>
        </div>
      </footer>

      <BottomSubscribeBar />

      {/* Newsletter Modal */}
      {showModal && !modalSubscribed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="rounded-[4px] border border-border bg-card p-8 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary rounded-[4px] flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary-foreground" size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Get the Edge</h2>
              <p className="text-muted-foreground text-sm">
                Join the leading newsletter for data center professionals. Sent every morning at 8 AM Dubai time.
              </p>
            </div>

            <ul className="space-y-2 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <Zap size={14} className="text-accent" /> Daily Market Briefing
              </li>
              <li className="flex items-center gap-2">
                <Zap size={14} className="text-accent" /> Exclusive M&A Rumors
              </li>
              <li className="flex items-center gap-2">
                <Zap size={14} className="text-accent" /> Regional Job Board (UAE/KSA)
              </li>
            </ul>

            <form onSubmit={handleModalSubscribe} className="space-y-4">
              <Input
                type="email"
                placeholder="Work email address"
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
                required
                className="h-12 rounded-[4px]"
              />
              <Button type="submit" className="w-full h-12 font-bold rounded-[4px]">
                Subscribe for Free
              </Button>
            </form>
          </div>
        </div>
      )}

      {showModal && modalSubscribed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="rounded-[4px] border border-border bg-card p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-accent rounded-[4px] flex items-center justify-center mx-auto mb-4">
              <Zap className="text-accent-foreground" size={24} />
            </div>
            <p className="text-lg font-semibold">Welcome aboard!</p>
            <p className="text-sm text-muted-foreground">Check your inbox.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;