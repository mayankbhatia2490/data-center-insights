import { Link, Navigate, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TimeAgo from "@/components/TimeAgo";
import NotFound from "@/pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_URL } from "@/config/site";
import { useArticles } from "@/hooks/useArticles";
import { useStory } from "@/hooks/useStory";
import { stripHtml } from "@/lib/stripHtml";
import { buildStoryJsonLd, sourceKind, storyDescription, storyPath, validationLabel } from "@/lib/storyMeta";

const SITE_NAME = "Data Center Pulse";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[9rem_1fr] gap-4 py-2.5 border-b border-border text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-foreground">{children}</dd>
  </div>
);

const Story = () => {
  const { slug = "" } = useParams();
  const { data, isLoading, isError } = useStory(slug);
  const { data: latest } = useArticles(undefined, 50);

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title={`Story unavailable — ${SITE_NAME}`} description="This story could not be loaded." path={storyPath(slug)} noindex />
        <Header />
        <main className="container max-w-3xl py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">We couldn’t load this story</h1>
          <p className="text-muted-foreground mb-4">Check your connection and try again.</p>
          <Link to="/news" className="text-primary underline">Back to the news</Link>
        </main>
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-3xl py-10 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    );
  }
  if (data.kind === "moved") return <Navigate to={storyPath(data.slug)} replace />;
  if (data.kind === "missing") return <NotFound />;

  const a = data.article;
  const kind = sourceKind(a.source_tier);
  const validation = validationLabel(a.validation_status);
  const orgs = a.named_entities?.organizations ?? [];
  const places = a.named_entities?.places ?? [];
  const summary = stripHtml(a.summary);
  // The "meaning" field repeats the insight on today's data; only show it when it adds something.
  const meaning = a.meaning && a.meaning !== a.insight ? a.meaning : null;
  const related = (latest ?? [])
    .filter((r) => r.id !== a.id && r.slug)
    .sort((x, y) => Number(y.category === a.category) - Number(x.category === a.category))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${a.title} — ${SITE_NAME}`}
        description={storyDescription(a)}
        path={storyPath(a.slug ?? slug)}
        type="article"
        image={a.image_url ?? undefined}
        jsonLd={buildStoryJsonLd(a, SITE_URL, SITE_NAME)}
      />
      <Header />
      <main className="container max-w-3xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:underline">Home</Link> / <Link to="/news" className="hover:underline">News</Link>
        </nav>
        <article>
          <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-primary mb-2">{a.category}</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-3">{a.title}</h1>
          <p className="text-xs text-muted-foreground mb-8">
            {a.source ? `${a.source} · ` : ""}
            <TimeAgo date={a.published_at ?? a.created_at} />
          </p>

          {summary && (
            <section aria-labelledby="in-short" className="mb-8">
              <h2 id="in-short" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">In short</h2>
              <p className="text-lg leading-relaxed">{summary}</p>
            </section>
          )}

          {a.insight && (
            <section aria-labelledby="why" className="mb-8 border-l-[3px] border-primary pl-4">
              <h2 id="why" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Why it matters</h2>
              <p className="leading-relaxed">{a.insight}</p>
              {meaning && <p className="leading-relaxed mt-2">{meaning}</p>}
              <p className="text-xs text-muted-foreground mt-2">Written by AI from the source article; it can contain mistakes.</p>
            </section>
          )}

          <section aria-labelledby="glance" className="mb-8">
            <h2 id="glance" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">At a glance</h2>
            <dl>
              {a.source && <Row label="Source">{a.source}</Row>}
              {kind && <Row label="Source type">{kind}</Row>}
              {validation && <Row label="Checks">{validation}</Row>}
              <Row label="Corroboration">Not yet checked against a second source</Row>
              {a.claim_type && <Row label="Claim type"><span className="capitalize">{a.claim_type}</span></Row>}
              {typeof a.confidence_score === "number" && <Row label="AI confidence">{a.confidence_score} / 100 (model estimate)</Row>}
              {orgs.length > 0 && <Row label="Companies">{orgs.join(", ")}</Row>}
              {places.length > 0 && <Row label="Places">{places.join(", ")}</Row>}
              <Row label="Published"><TimeAgo date={a.published_at ?? a.created_at} /></Row>
            </dl>
            <p className="text-xs text-muted-foreground mt-2">
              How we choose and check sources: <Link to="/about/methodology" className="text-primary underline">methodology</Link>.
            </p>
          </section>

          {a.people && a.people.length > 0 && (
            <section aria-labelledby="people" className="mb-8">
              <h2 id="people" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">People mentioned</h2>
              <p className="text-sm">
                {a.people.map((p, i) => (
                  <span key={p.id}>
                    <Link to={`/leaders/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                    {i < a.people!.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </section>
          )}

          {a.source_url && (
            <a
              href={a.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline"
            >
              Read the original at {a.source ?? "the source"} <ExternalLink size={14} />
            </a>
          )}
        </article>

        {related.length > 0 && (
          <aside aria-labelledby="related" className="mt-12 pt-6 border-t border-border">
            <h2 id="related" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">More stories</h2>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link to={storyPath(r.slug!)} className="font-semibold hover:text-primary">{r.title}</Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Story;
