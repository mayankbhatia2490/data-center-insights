import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSubscribe } from "@/hooks/useSubscribe";

const BottomSubscribeBar = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { subscribe, isLoading } = useSubscribe();

  useEffect(() => {
    // Only show after 5 seconds of browsing
    const timer = setTimeout(() => {
      const onScroll = () => {
        if (window.scrollY > 300) {
          setVisible(true);
          window.removeEventListener("scroll", onScroll);
        }
      };
      // If already scrolled past threshold, show immediately after delay
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        window.addEventListener("scroll", onScroll, { passive: true });
      }
      return () => window.removeEventListener("scroll", onScroll);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-minimize after 8 seconds of being visible
  useEffect(() => {
    if (visible && !subscribed && !minimized) {
      const timer = setTimeout(() => setMinimized(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [visible, subscribed, minimized]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const result = await subscribe(email);
    if (result.success) {
      setSubscribed(true);
      setEmail("");
    }
  };

  if (!visible || dismissed) return null;

  if (subscribed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[hsl(213,52%,25%)] border-t border-border flex items-center justify-center gap-2">
        <CheckCircle className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-accent">You're in — check your inbox.</span>
      </div>
    );
  }

  if (minimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 cursor-pointer transition-all duration-300 animate-in slide-in-from-bottom-2"
        onClick={() => setMinimized(false)}
      >
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform">
          📩 Subscribe
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[hsl(213,52%,25%)] border-t border-border animate-in slide-in-from-bottom duration-300">
      <div className="container h-full flex items-center justify-between gap-4">
        <span className="text-[11px] text-muted-foreground hidden sm:block shrink-0">
          Join <span className="text-foreground font-semibold">5,000+</span> data center professionals
        </span>
        <form onSubmit={handleSubscribe} className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <Input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-8 text-xs bg-secondary border-border flex-1 rounded-[4px]"
          />
          <Button type="submit" size="sm" className="h-8 text-xs px-4 font-bold shrink-0 rounded-[4px]" disabled={isLoading}>
            {isLoading ? "..." : "Subscribe Free"}
          </Button>
        </form>
        <button
          onClick={() => setMinimized(true)}
          className="text-muted-foreground hover:text-foreground text-lg leading-none ml-2 shrink-0"
          aria-label="Minimize"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default BottomSubscribeBar;
