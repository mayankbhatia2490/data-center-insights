import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

// Update VITE_SITE_URL once the production domain is purchased/finalized.
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://data-center-insights-fawn.vercel.app").replace(/\/$/, "");
const SITE_NAME = "Data Center Pulse";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  image?: string;
  // Keeps the page out of search results (login, account, admin, 404).
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const Seo = ({ title, description, path, type = "website", image, noindex = false, jsonLd }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const img = image || DEFAULT_IMAGE;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  // index.html ships fallback meta tags for crawlers that do not run JavaScript
  // (link-preview bots). Once this component runs, it owns the tags, so drop the
  // fallbacks to avoid duplicate title/description/og/canonical entries.
  useEffect(() => {
    document.querySelectorAll("[data-static-seo]").forEach((el) => el.remove());
  }, []);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      {schemas.map((schema, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
