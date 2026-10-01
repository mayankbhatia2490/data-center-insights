import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TimeAgo from "@/components/TimeAgo";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_URL } from "@/config/site";
import { useTracker } from "@/hooks/useFacilities";
import { facilityPath, stageLabel, trackerStats } from "@/lib/facility";

const Meter = ({ label, value, total }: { label: string; value: number; total: number }) => (
  <div className="py-2.5 border-b border-border">
    <div className="flex justify-between text-sm mb-1.5">
      <span>{label}</span>
      <span className="tabular-nums text-muted-foreground">{value} of {total}</span>
    </div>
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden" role="presentation">
      <div className="h-full bg-primary" style={{ width: `${total ? Math.round((value / total) * 100) : 0}%` }} />
    </div>
  </div>
);

const Tracker = () => {
  const { data, isLoading, isError } = useTracker();

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Data center tracker — Data Center Pulse" description="MENA data center tracker." path="/data" noindex />
        <Header />
        <main className="container max-w-3xl py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">We couldn’t load the tracker</h1>
          <p className="text-muted-foreground">Check your connection and try again.</p>
        </main>
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-3xl py-10 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    );
  }

  const stats = trackerStats(data.facilities, data.sourceCounts);
  const names = new Map(data.facilities.map((f) => [f.id, f]));
  const grouped = new Map<string, typeof data.facilities>();
  for (const f of data.facilities) grouped.set(f.country, [...(grouped.get(f.country) ?? []), f]);
  const description = `${stats.total} data center records across ${stats.countries} MENA countries, with operator, stage, capacity and sources shown as published and "Not disclosed" where they are not.`;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="MENA data center tracker — Data Center Pulse"
        description={description}
        path="/data"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "MENA data center tracker",
            description,
            url: `${SITE_URL}/data`,
            creator: { "@type": "Organization", name: "Data Center Pulse", url: `${SITE_URL}/` },
            spatialCoverage: "Middle East and North Africa",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Data center tracker", item: `${SITE_URL}/data` },
            ],
          },
        ]}
      />
      <Header />
      <main className="container max-w-3xl py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">MENA data center tracker</h1>

        <section aria-labelledby="in-short" className="mb-8">
          <h2 id="in-short" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">In short</h2>
          <p className="text-lg leading-relaxed">
            We track {stats.total} data center records in {stats.countries} countries. {stats.withCoordinates} have coordinates,{" "}
            {stats.withCapacity} have a published capacity and {stats.verified} have been verified. Where something has not been
            published, the page says “Not disclosed” instead of estimating it.
          </p>
        </section>

        <section aria-labelledby="coverage" className="mb-10">
          <h2 id="coverage" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">How complete the data is</h2>
          <Meter label="Has coordinates" value={stats.withCoordinates} total={stats.total} />
          <Meter label="Has a source on file" value={stats.withSource} total={stats.total} />
          <Meter label="Has a published capacity" value={stats.withCapacity} total={stats.total} />
          <Meter label="Verified" value={stats.verified} total={stats.total} />
          <p className="text-xs text-muted-foreground mt-2">
            Sources on file are not yet reviewed. How we collect and check: <Link to="/about/methodology" className="text-primary underline">methodology</Link>.
            The map and charts are on the <Link to="/stats" className="text-primary underline">statistics page</Link>.
          </p>
        </section>

        <section aria-labelledby="countries" className="mb-10">
          <h2 id="countries" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">By country</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 font-medium text-right">Records</th>
                  <th className="py-2 pr-4 font-medium text-right">Operational</th>
                  <th className="py-2 pr-4 font-medium text-right">Under construction</th>
                  <th className="py-2 pr-4 font-medium text-right">Planned</th>
                  <th className="py-2 font-medium text-right">Stage not disclosed</th>
                </tr>
              </thead>
              <tbody>
                {stats.byCountry.map(([country, c]) => (
                  <tr key={country} className="border-b border-border tabular-nums">
                    <th scope="row" className="py-2 pr-4 text-left font-medium">{country}</th>
                    <td className="py-2 pr-4 text-right">{c.total}</td>
                    <td className="py-2 pr-4 text-right">{c.operational}</td>
                    <td className="py-2 pr-4 text-right">{c.underConstruction}</td>
                    <td className="py-2 pr-4 text-right">{c.planned}</td>
                    <td className="py-2 text-right">{c.unknown}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="changes" className="mb-10">
          <h2 id="changes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">What changed</h2>
          {data.changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes have been recorded yet.</p>
          ) : (
            <>
              <ul className="space-y-2 text-sm">
                {data.changes.slice(0, 10).map((c) => {
                  const f = names.get(c.data_center_id);
                  return (
                    <li key={c.id}>
                      {f ? <Link to={facilityPath(f)} className="font-semibold text-primary hover:underline">{f.canonical_name}</Link> : "A facility"}
                      {" "}moved to <strong>{stageLabel(c.lifecycle_stage).toLowerCase()}</strong> · <TimeAgo date={c.changed_at} />
                    </li>
                  );
                })}
              </ul>
              {data.changes.length < 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Only {data.changes.length} status {data.changes.length === 1 ? "change has" : "changes have"} been recorded so far. This list grows as sources are checked.
                </p>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="all" className="mb-4">
          <h2 id="all" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">All records</h2>
          {[...grouped.entries()].map(([country, list]) => (
            <div key={country} className="mb-6">
              <h3 className="font-bold mb-1">{country}</h3>
              <ul className="columns-1 sm:columns-2 gap-8 text-sm">
                {list.map((f) => (
                  <li key={f.id} className="break-inside-avoid py-0.5">
                    <Link to={facilityPath(f)} className="hover:text-primary">{f.canonical_name}</Link>
                    {f.city && f.city !== f.canonical_name ? <span className="text-muted-foreground">, {f.city}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Tracker;
