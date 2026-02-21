import { useState, useEffect } from "react";
import { Menu, X, Zap, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSubscribe } from "@/hooks/useSubscribe";

const navLinks = [
  { label: "Global News", filter: "All", href: "/#news" },
  { label: "Middle East Focus", filter: "Middle East", href: "/#news" },
  { label: "Hyperscale", filter: "AI", href: "/#news" },
  { label: "Sustainability", filter: "Sustainability", href: "/#news" },
  { label: "Intelligence", filter: null, href: "/intelligence" },
  { label: "Insights", filter: null, href: "/insights" },
  { label: "Leaders", filter: null, href: "/leaders" },
];

const tickerHeadlines = [
  "BREAKING: Blackstone closes $10B European data center deal",
  "NVIDIA unveils next-gen liquid cooling for AI racks",
  "AWS commits $7.8B to Saudi Arabia infrastructure",
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Global News");
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains("light"));
  const { subscribe, isLoading } = useSubscribe();

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      setIsDark(false);
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const result = await subscribe(email);
    if (result.success) {
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
      {/* Top loading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
        <div className="h-full bg-primary animate-progress-load" />
      </div>

      {/* Row 1: Top Bar — 36px, 8px grid */}

      {/* Row 2: Main Header — 64px */}
      <header className="sticky top-0 z-50 h-16 bg-card border-b-2 border-b-primary">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">
              Data Center <span className="text-primary">Pulse</span>
            </span>
          </div>

          <nav className="hidden items-center gap-0 md:flex h-full">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLink(link.label);
                  if (link.filter !== null) {
                    if (location.pathname !== "/") {
                      navigate("/");
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("nav-filter", { detail: link.filter }));
                        document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
                      }, 300);
                    } else {
                      window.dispatchEvent(new CustomEvent("nav-filter", { detail: link.filter }));
                      document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
                    }
                  } else {
                    navigate(link.href);
                  }
                }}
                className={`h-full flex items-center px-4 text-[13px] font-medium transition-colors duration-200 ${
                  activeLink === link.label
                    ? "text-foreground border-b-2 border-b-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-b-transparent"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="hidden sm:inline-flex rounded-[4px]"
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
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveLink(link.label);
                    setMobileOpen(false);
                    if (link.filter !== null) {
                      if (location.pathname !== "/") {
                        navigate("/");
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent("nav-filter", { detail: link.filter }));
                          document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
                        }, 300);
                      } else {
                        window.dispatchEvent(new CustomEvent("nav-filter", { detail: link.filter }));
                        document.getElementById("news")?.scrollIntoView({ behavior: "smooth" });
                      }
                    } else {
                      navigate(link.href);
                    }
                  }}
                >
                  {link.label}
                </a>
              ))}
              <Button size="sm" className="rounded-[4px]" onClick={() => { setDialogOpen(true); setMobileOpen(false); }}>
                Subscribe
              </Button>
            </nav>
          </div>
        )}
      </header>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[4px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Join Data Center Pulse</DialogTitle>
            <DialogDescription>
              Get the intelligence that matters, delivered daily.
            </DialogDescription>
          </DialogHeader>
          {subscribed ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[4px] bg-accent/20">
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
                className="rounded-[4px]"
              />
              <Button type="submit" className="w-full rounded-[4px]" disabled={isLoading}>
                {isLoading ? "Subscribing..." : "Subscribe Free"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
