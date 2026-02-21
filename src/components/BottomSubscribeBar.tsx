import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSubscribe } from "@/hooks/useSubscribe";

const BottomSubscribeBar = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [visible, setVisible] = useState(false);
  const { subscribe, isLoading } = useSubscribe();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const result = await subscribe(email);
    if (result.success) {
      setSubscribed(true);
      setEmail("");
    }
  };

  if (!visible) return null;

  if (subscribed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[hsl(213,52%,25%)] border-t border-border flex items-center justify-center gap-2">
        <CheckCircle className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-accent">You're in — check your inbox.</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[hsl(213,52%,25%)] border-t border-border">
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
      </div>
    </div>
  );
};

export default BottomSubscribeBar;
