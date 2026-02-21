import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const navLinks = [
  { label: "Global News", href: "#news" },
  { label: "Middle East Focus", href: "#news" },
  { label: "Hyperscale", href: "#news" },
  { label: "Sustainability", href: "#news" },
];

const tickerHeadlines = [
  "BREAKING: Blackstone closes $10B European data center deal",
  "NVIDIA unveils next-gen liquid cooling for AI racks",
  "AWS commits $7.8B to Saudi Arabia infrastructure",
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setDialogOpen(false);
        setSubscribed(false);
        setEmail("");
      }, 2000);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Row 1: Top Bar */}
      <div className="h-9 bg-background border-b border-border overflow-hidden">
        <div className="container h-full flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground shrink-0 hidden sm:block">{today}</span>
          <div className="flex-1 mx-6 overflow-hidden relative">
            <div className="flex animate-ticker-scroll whitespace-nowrap gap-12">
              {[...tickerHeadlines, ...tickerHeadlines].map((headline, i) => (
                <span key={i} className="text-muted-foreground">
                  <span className="text-destructive font-bold mr-1.5">●</span>
                  {headline}
                </span>
              ))}
            </div>
          </div>
          <span className="text-muted-foreground shrink-0 hidden sm:block">
            Edition: <span className="text-foreground font-semibold">Dubai</span> | Global
          </span>
        </div>
      </div>

      {/* Row 2: Main Header */}
      <header className="sticky top-0 z-50 h-16 bg-card border-b-2 border-b-primary">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">
              Data Center <span className="text-primary">Pulse</span>
            </span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="hidden sm:inline-flex"
            >
              Subscribe
            </Button>
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-card p-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button size="sm" onClick={() => { setDialogOpen(true); setMobileOpen(false); }}>
                Subscribe
              </Button>
            </nav>
          </div>
        )}
      </header>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Join Data Center Pulse</DialogTitle>
            <DialogDescription>
              Get the intelligence that matters, delivered daily.
            </DialogDescription>
          </DialogHeader>
          {subscribed ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <p className="text-lg font-semibold">Thanks for joining!</p>
              <p className="text-sm text-muted-foreground">Check your inbox for a confirmation.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Daily Briefing on M&A, AI & Infrastructure
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Market Analysis & REIT Tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Exclusive Job Board Access
                </li>
              </ul>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">Subscribe Free</Button>
              <p className="text-center text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
