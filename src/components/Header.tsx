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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
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
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
              Get the Newsletter
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
          <div className="border-t border-border/50 bg-background p-4 md:hidden">
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
                Get the Newsletter
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
