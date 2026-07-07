import Seo from "@/components/Seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import { Users, Zap, ArrowLeft, ExternalLink, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const LeaderProfile = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["leader-profile", id],
    queryFn: async () => {
      const { data: person, error } = await supabase
        .from("people")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;

      const { data: mentions } = await supabase
        .from("article_people")
        .select("id, context_excerpt, role_in_article, created_at, article_id")
        .eq("person_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch articles for these mentions
      const articleIds = (mentions || []).map((m) => m.article_id).filter(Boolean);
      let articles: any[] = [];
      if (articleIds.length > 0) {
        const { data: arts } = await supabase
          .from("articles")
          .select("id, title, source, source_url, published_at")
          .in("id", articleIds);
        articles = arts || [];
      }

      const articleMap = new Map(articles.map((a) => [a.id, a]));

      return {
        person,
        mentions: (mentions || []).map((m) => ({
          ...m,
          article: articleMap.get(m.article_id),
        })),
      };
    },
    enabled: !!id,
  });

  const person = data?.person;
  const mentions = data?.mentions || [];

  return (
    <div className="min-h-screen bg-background">
      {person && (
        <Seo
          title={`${person.name} — Data Center Pulse`}
          description={`${person.name}${person.title ? `, ${person.title}` : ""}${person.organization ? ` at ${person.organization}` : ""} — profile, coverage, and news mentions on Data Center Pulse.`}
          path={`/leaders/${person.id}`}
          type="profile"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: person.name,
              jobTitle: person.title || undefined,
              worksFor: person.organization
                ? { "@type": "Organization", name: person.organization }
                : undefined,
            },
          }}
        />
      )}
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12 max-w-4xl">
        <Link to="/leaders" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 no-underline">
          <ArrowLeft size={12} /> Back to Leaders
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : !person ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-muted-foreground">Leader not found</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {person.image_url ? (
                  <img src={person.image_url} alt={person.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Users size={28} className="text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">{person.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {person.title}{person.organization ? ` — ${person.organization}` : ""}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {person.region && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-[4px]">
                      {person.region}
                    </span>
                  )}
                  <span className="font-mono font-bold text-foreground">{person.mention_count} mentions</span>
                  {person.first_mentioned && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      Since {new Date(person.first_mentioned).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {person.bio && <p className="text-sm text-foreground/80 mt-3">{person.bio}</p>}
              </div>
            </div>

            {/* Mentions Timeline */}
            <h2 className="text-lg font-bold text-foreground mb-4">Recent Mentions</h2>
            {mentions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mentions recorded yet.</p>
            ) : (
              <div className="space-y-0">
                {mentions.map((m: any) => (
                  <div
                    key={m.id}
                    className="border-b border-border py-4 flex flex-col md:flex-row md:items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      {m.article ? (
                        <a
                          href={m.article.source_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors no-underline flex items-center gap-1"
                        >
                          {m.article.title}
                          <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Article unavailable</span>
                      )}
                      {m.context_excerpt && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{m.context_excerpt}"</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        {m.role_in_article && (
                          <span className="font-bold uppercase tracking-wider text-primary">{m.role_in_article}</span>
                        )}
                        {m.article?.source && <span>{m.article.source}</span>}
                        {m.article?.published_at && (
                          <span>{formatDistanceToNow(new Date(m.article.published_at), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Data Center Pulse</span>
          </div>
          <span className="text-xs text-muted-foreground">© 2026 Data Center Pulse</span>
        </div>
      </footer>
    </div>
  );
};

export default LeaderProfile;
