import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle } from "lucide-react";

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="container relative py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            Trusted by 5,000+ Industry Professionals
          </div>

          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            The Daily Intelligence for{" "}
            <span className="text-gradient">Data Center Leaders</span>
          </h1>

          <p className="mb-8 text-base text-muted-foreground md:text-lg">
            Curated insights on M&A, Edge Computing, and AI Infrastructure.
            Read by pros at Equinix, AWS, Google, and Digital Realty.
          </p>

          {subscribed ? (
            <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-4">
              <CheckCircle className="h-5 w-5 text-accent" />
              <span className="font-medium text-accent">Thanks for joining! Check your inbox.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 flex-1 bg-secondary/50 text-base"
              />
              <Button type="submit" size="lg" className="h-12 px-8 font-semibold">
                Subscribe Free
              </Button>
            </form>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            No spam. Unsubscribe anytime. Join industry leaders.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
