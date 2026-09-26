import { Helmet } from "react-helmet-async";

// Update VITE_SITE_URL once the production domain is purchased/finalized.
const SITE_URL = import.meta.env.VITE_SITE_URL || "https://data-center-insights-fawn.vercel.app";
const SITE_NAME = "Data Center Pulse";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const Seo = ({ title, description, path, type = "website", jsonLd }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {schemas.map((schema, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
