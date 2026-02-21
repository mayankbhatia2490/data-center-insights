import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NewsTicker from "@/components/NewsTicker";
import BottomSubscribeBar from "@/components/BottomSubscribeBar";
import NewsCard from "@/components/NewsCard";
import Sidebar from "@/components/Sidebar";
import { useArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { Zap, Mail, X, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import NewsChatbot from "@/components/NewsChatbot";
import DailyDigest from "@/components/DailyDigest";
import EditorsPicks from "@/components/EditorsPicks";
import { useSubscribe } from "@/hooks/useSubscribe";
import { Link } from "react-router-dom";

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: articles, isLoading } = useArticles(activeFilter, 50);
  const { subscribe, isLoading: subLoading } = useSubscribe();

  const visibleNews = (articles || []).slice(0, visibleCount);
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalSubscribed, setModalSubscribed] = useState(false);

  // Reading progress
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for nav filter changes from Header
  useEffect(() => {
    const handler = (e: Event) => {
      const filter = (e as CustomEvent).detail as string;
      setActiveFilter(filter);
      setVisibleCount(6);
    };
    window.addEventListener("nav-filter", handler);
    return () => window.removeEventListener("nav-filter", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleModalSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail) return;
    const result = await subscribe(modalEmail);
    if (result.success) {
      setModalSubscribed(true);
      setTimeout(() => setShowModal(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[70] h-[2px]">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <Header />
      <NewsTicker />
      <HeroSection />
      <DailyDigest />
      <EditorsPicks />

      <main id="news" className="container py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Latest Briefing
          </h2>
          <div className="flex gap-2 flex-wrap">
            {["All", "M&A", "AI", "Middle East", "Sustainability", "Policy"].map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setVisibleCount(6); }}
                className={`rounded-[4px] px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  activeFilter === filter
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-6 px-6 py-6 border-b border-border">
                  <Skeleton className="w-44 h-28 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : visibleNews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-semibold">No articles yet</p>
                <p className="text-sm mt-1">News will appear here once the aggregator runs.</p>
              </div>
            ) : (
              <>
                {visibleNews.map((article, i) => (
                  <NewsCard key={article.id} article={article} isFirst={i === 0} />
                ))}
                {visibleCount < (articles?.length || 0) && (
                  <div className="flex justify-center py-8">
                    <button
                      onClick={() => setVisibleCount((c) => Math.min(c + 4, articles?.length || 0))}
                      className="text-muted-foreground hover:text-foreground font-medium border-b border-border pb-1 hover:border-foreground transition-all duration-200 text-sm"
                    >
                      Load previous days
                    </button>
                  </div>
                )}
              </>
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/archive" className="hover:text-foreground transition-colors no-underline text-muted-foreground">
              Briefing Archive
            </Link>
            <span>© 2026 Data Center Pulse. Intelligence for infrastructure leaders.</span>
          </div>
        </div>
      </footer>

      <BottomSubscribeBar />
      <NewsChatbot />

      {/* Newsletter Modal */}
      {showModal && !modalSubscribed && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="rounded-[4px] border border-border bg-card p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
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
              <Button type="submit" className="w-full h-12 font-bold rounded-[4px]" disabled={subLoading}>
                {subLoading ? "Subscribing..." : "Subscribe for Free"}
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
