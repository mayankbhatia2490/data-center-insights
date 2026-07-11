import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { Link } from "react-router-dom";

const FREE_FEATURES = [
  "Daily AI-curated MENA data center digest",
  "Breaking news feed with sentiment tagging",
  "Executive & organization directory",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Market Signals — emerging risk & opportunity alerts",
  "Regional outlook & capacity tracking",
  "Weekly strategic insights digest",
  "Priority support",
];

const Pricing = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { startCheckout, isLoading } = useCheckout();

  return (
    <div className="min-h-screen bg-background pb-16">
      <Seo
        title="Pricing — Data Center Pulse"
        description="Free daily MENA data center intelligence, or upgrade to Premium for market signals, capacity data, and regional outlook."
        path="/pricing"
      />
      <Header />

      <main className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-tight mb-2">Plans for every reader</h1>
          <p className="text-muted-foreground">
            Start free. Upgrade when you need deeper investor-grade intelligence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-border bg-card rounded-[4px] p-8">
            <h2 className="font-bold text-xl mb-1">Free</h2>
            <p className="text-3xl font-black mb-4">$0</p>
            <ul className="space-y-2 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled>
              {user ? "Current plan" : "Included automatically"}
            </Button>
          </div>

          <div className="border-2 border-primary bg-card rounded-[4px] p-8 relative">
            <span className="absolute -top-3 left-8 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              For investors & operators
            </span>
            <h2 className="font-bold text-xl mb-1 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Premium
            </h2>
            <p className="text-3xl font-black mb-4">Contact us</p>
            <ul className="space-y-2 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <Button className="w-full" disabled>
                Current plan
              </Button>
            ) : user ? (
              <Button className="w-full" onClick={startCheckout} disabled={isLoading}>
                {isLoading ? "Redirecting..." : "Upgrade to Premium"}
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link to="/login">Sign in to upgrade</Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
