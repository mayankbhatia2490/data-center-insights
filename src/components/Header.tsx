import { useState, useEffect } from "react";
import { Menu, X, Zap, UserCircle } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Global News", filter: "All", href: "/#news" },
  { label: "Middle East Focus", filter: "Middle East", href: "/#news" },
  { label: "Sustainability", filter: "Sustainability", href: "/#news" },
  { label: "Tracker", filter: null, href: "/data" },
  { label: "Statistics", filter: null, href: "/stats" },
  { label: "Intelligence", filter: null, href: "/intelligence" },
  { label: "Insights", filter: null, href: "/insights" },
  { label: "Leaders", filter: null, href: "/leaders" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Global News");
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { subscribe, isLoading } = useSubscribe();
  const { user } = useAuth();

  // Highlight the tab for the page you are on (Tracker on /data, Statistics on /stats, and so on).
  // On the home page and the news pages, the news filter you last picked stays highlighted.
  const pathLabel = navLinks.find(
    (l) => !l.href.startsWith("/#") && (location.pathname === l.href || location.pathname.startsWith(`${l.href}/`)),
  )?.label;
  const currentLabel = pathLabel ?? (location.pathname === "/" || location.pathname.startsWith("/news") ? activeLink : null);

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

  return (
    <>
      {/* Top loading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
        <div className="h-full bg-primary animate-progress-load" />
      </div>

      {/* Row 1: Top Bar — 36px, 8px grid */}

      {/* Row 2: Main Header — 64px */}
      <header className="sticky top-0 z-50 h-16 bg-background border-b border-border">
        <div className="container h-full flex items-center justify-between">
          <Link to="/" className="font-serif text-[22px] font-semibold tracking-[-0.01em] text-foreground no-underline">
            Data Center <span className="text-primary">Pulse</span>
          </Link>

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
                  currentLabel === link.label
                    ? "text-foreground border-b-2 border-b-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-b-transparent"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={user ? "/account" : "/login"}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
              aria-label={user ? "Account" : "Sign in"}
            >
              <UserCircle size={18} />
            </Link>
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
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[4px] bg-positive/20">
                <Zap className="h-6 w-6 text-positive" />
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
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                  Market Analysis & REIT Tracking
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
