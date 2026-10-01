import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TimeAgo from "@/components/TimeAgo";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/hooks/useArticles";
import { stripHtml } from "@/lib/stripHtml";
import { storyPath } from "@/lib/storyMeta";

const News = () => {
  const { data: articles, isLoading } = useArticles(undefined, 50);
  const stories = (articles ?? []).filter((a) => a.slug);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Latest MENA data center news — Data Center Pulse"
        description="Source-linked MENA data center stories, each with a short summary and why it matters. Specialist and official sources only."
        path="/news"
      />
      <Header />
      <main className="container max-w-3xl py-10 md:py-14">
        <h1 className="text-3xl font-black tracking-tight mb-2">Latest MENA data center news</h1>
        <p className="text-muted-foreground mb-8">
          Every story links to its original source and states what kind of source it is.
        </p>
        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : (
          <ul className="divide-y divide-border">
            {stories.map((a) => (
              <li key={a.id} className="py-5">
                <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-primary mb-1">
                  {a.category} · <span className="text-muted-foreground font-medium normal-case tracking-normal"><TimeAgo date={a.published_at} /></span>
                </p>
                <h2 className="text-lg font-bold leading-snug">
                  <Link to={storyPath(a.slug!)} className="hover:text-primary">{a.title}</Link>
                </h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stripHtml(a.summary)}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default News;
