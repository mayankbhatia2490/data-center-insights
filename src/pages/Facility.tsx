import { Link, Navigate, useParams } from "react-router-dom";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TimeAgo from "@/components/TimeAgo";
import NotFound from "@/pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_URL } from "@/config/site";
import { useFacility } from "@/hooks/useFacilities";
import {
  INDEX_THRESHOLD,
  KEY_FIELDS,
  buildFacilityJsonLd,
  capacityLabel,
  completeness,
  facilityDescription,
  facilityPath,
  facilityTitle,
  isIndexable,
  stageLabel,
} from "@/lib/facility";

const ND = <span className="text-muted-foreground">Not disclosed</span>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[9rem_1fr] gap-4 py-2.5 border-b border-border text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd>{children}</dd>
  </div>
);

const PRECISION: Record<string, string> = {
  exact: "Exact location",
  approximate: "Approximate location",
  city_centroid: "City centre only",
  undisclosed: "Location not disclosed",
};

const Facility = () => {
  const { country = "", slug = "" } = useParams();
  const { data, isLoading, isError } = useFacility(country, slug);

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Facility unavailable — Data Center Pulse" description="This facility could not be loaded." path={`/data/facilities/${country}/${slug}`} noindex />
        <Header />
        <main className="container max-w-3xl py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">We couldn’t load this facility</h1>
          <Link to="/data" className="text-primary underline">Back to the tracker</Link>
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
  if (data.kind === "moved") return <Navigate to={`/data/facilities/${data.country}/${data.slug}`} replace />;
  if (data.kind === "missing") return <NotFound />;

  const { facility: f, sources, history, sourceCount } = data;
  const score = completeness(f, sourceCount);
  const indexable = isIndexable(f, sourceCount);
  const missing = KEY_FIELDS.filter((k) => !score.present.includes(k.key));
  const where = [f.city, f.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${facilityTitle(f)} — Data Center Pulse`}
        description={facilityDescription(f)}
        path={facilityPath(f)}
        noindex={!indexable}
        jsonLd={indexable ? buildFacilityJsonLd(f, SITE_URL) : undefined}
      />
      <Header />
      <main className="container max-w-3xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:underline">Home</Link> / <Link to="/data" className="hover:underline">Tracker</Link> / {f.country}
        </nav>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.01em] leading-tight mb-3">{f.canonical_name}</h1>

        <section aria-labelledby="in-short" className="mb-8">
          <h2 id="in-short" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">In short</h2>
          <p className="text-lg leading-relaxed">{facilityDescription(f, 400)}</p>
        </section>

        <section aria-labelledby="facts" className="mb-8">
          <h2 id="facts" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Facts</h2>
          <dl>
            <Row label="Operator">{f.operator_name || ND}</Row>
            <Row label="Location">{where || ND}</Row>
            <Row label="Address">{f.address || ND}</Row>
            <Row label="Map precision">{PRECISION[f.location_precision] ?? "Location not disclosed"}</Row>
            <Row label="Stage">{f.lifecycle_stage !== "unknown" ? stageLabel(f.lifecycle_stage) : ND}</Row>
            <Row label="Capacity">{f.capacity_mw != null ? capacityLabel(f) : ND}</Row>
            <Row label="Operational since">{f.year_operational ?? ND}</Row>
            <Row label="Energization">{f.estimated_energization || ND}</Row>
            <Row label="Website">
              {f.website_url ? <a href={f.website_url} rel="noopener noreferrer nofollow" className="text-primary underline">{f.website_url}</a> : ND}
            </Row>
            <Row label="Verification">
              {f.verification_status === "verified" ? (
                <>Verified{f.last_verified_at ? <> · <TimeAgo date={f.last_verified_at} /></> : null}</>
              ) : (
                "Not yet verified"
              )}
            </Row>
          </dl>
        </section>

        <section aria-labelledby="history" className="mb-8">
          <h2 id="history" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Status history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <strong>{stageLabel(h.lifecycle_stage)}</strong> · <TimeAgo date={h.changed_at} />
                  {h.note ? <span className="block text-muted-foreground">{h.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="sources" className="mb-8">
          <h2 id="sources" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Sources</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source is on file for this record yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sources.map((s) => (
                <li key={s.id}>
                  {s.source_url ? (
                    <a href={s.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">
                      {s.source_title || s.source_name}
                    </a>
                  ) : (
                    s.source_title || s.source_name
                  )}
                  <span className="text-muted-foreground"> · {s.source_name} · {s.review_status === "pending" ? "not yet reviewed" : s.review_status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="complete" className="mb-8">
          <h2 id="complete" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Record completeness: {score.score} of {score.total}
          </h2>
          {missing.length > 0 && (
            <p className="text-sm text-muted-foreground">Missing: {missing.map((m) => m.label.toLowerCase()).join(", ")}.</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Records with fewer than {INDEX_THRESHOLD} of {score.total} fields are kept out of search results until they fill in. How we collect and check:{" "}
            <Link to="/about/methodology" className="text-primary underline">methodology</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Facility;
