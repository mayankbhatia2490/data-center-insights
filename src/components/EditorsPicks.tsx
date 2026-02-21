import { useArticles } from "@/hooks/useArticles";
import { Award, ArrowRight, Mail } from "lucide-react";
import { stripHtml } from "@/lib/stripHtml";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSubscribe } from "@/hooks/useSubscribe";

const EditorsPicks = () => {
  const { data: articles } = useArticles(undefined, 50);
  const { subscribe, isLoading } = useSubscribe();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const result = await subscribe(email);
    if (result.success) setSubscribed(true);
  };

  if (!articles || articles.length === 0) return null;

  // Pick articles with sentiment (Bullish preferred) as "editor's picks"
  const picks = articles
    .filter((a) => a.sentiment === "Bullish" || a.sentiment === "Bearish")
    .slice(0, 4);

  // Fallback to first 4 if no sentiment-tagged articles
  const displayPicks = picks.length >= 3 ? picks : articles.slice(0, 4);

  const categoryColors: Record<string, string> = {
    "M&A": "text-chart-1",
    AI: "text-primary",
    Sustainability: "text-chart-2",
    "Middle East": "text-chart-4",
    Policy: "text-chart-5",
  };

  return (
    <section className="container py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Editor's Picks */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Award className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold uppercase tracking-wider">
              Editor's Picks
            </h2>
            <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Curated
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayPicks.map((article) => (
              <a
                key={article.id}
                href={article.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-[4px] border border-border bg-card/50 p-5 hover:border-primary/30 hover:bg-card transition-all duration-200 no-underline"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      categoryColors[article.category || ""] || "text-primary"
                    }`}
                  >
                    {article.category}
                  </span>
                  {article.sentiment && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-[2px] font-bold uppercase tracking-wider ${
                        article.sentiment === "Bullish"
                          ? "bg-chart-2/15 text-chart-2"
                          : article.sentiment === "Bearish"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {article.sentiment}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground/90 leading-snug mb-2 group-hover:text-foreground transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {stripHtml(article.summary)}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                  Read more <ArrowRight size={10} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter CTA Card */}
        <div className="flex items-start">
          <div className="w-full rounded-[4px] border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-8 sticky top-24">
            <div className="w-10 h-10 bg-primary rounded-[4px] flex items-center justify-center mb-4">
              <Mail className="text-primary-foreground" size={20} />
            </div>
            <h3 className="text-xl font-bold mb-2">
              Don't Miss Tomorrow's Briefing
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              Join <strong>industry executives</strong> who start their day with
              Data Center Pulse.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-6">
              <li>✓ Daily intelligence digest at 8:30 AM Dubai</li>
              <li>✓ M&A deal flow & market intelligence</li>
              <li>✓ Sustainability & policy alerts</li>
              <li>✓ Free forever — no spam</li>
            </ul>

            {subscribed ? (
              <div className="text-center py-4">
                <p className="text-sm font-semibold text-chart-2">
                  ✓ You're subscribed!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your inbox tomorrow morning.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Work email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-[4px] bg-background/50"
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-bold rounded-[4px]"
                  disabled={isLoading}
                >
                  {isLoading ? "Subscribing..." : "Get the Daily Briefing →"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorsPicks;
