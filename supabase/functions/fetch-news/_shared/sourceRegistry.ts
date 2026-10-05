export type SourceTier = 1 | 2;
export type SourceType = "primary" | "specialist_media" | "established_business_media";

export type SourcePolicy = {
  source: string;
  domain: string;
  feed?: string;
  tier: SourceTier;
  type: SourceType;
  reliability: number;
  region: "UAE" | "GCC" | "MENA" | "GLOBAL";
  direct: boolean;
  allowedForAutoPublish: boolean;
  requiresCorroboration: boolean;
};

/**
 * Source policy for the India/Middle East data-centre intelligence pipeline.
 *
 * `direct: true` means the URL is polled by fetch-news as RSS/Atom.
 * `direct: false` means the domain is eligible only when discovered through
 * GDELT or another discovery adapter; the original URL remains the evidence.
 */
export const SOURCE_REGISTRY: SourcePolicy[] = [
  // UAE / GCC primary sources with a directly pollable XML feed.
  { source: "Khazna Data Centers", domain: "khaznadatacenters.com", feed: "https://khaznadatacenters.com/feed/", tier: 1, type: "primary", reliability: 94, region: "UAE", direct: true, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "MEEZA", domain: "meeza.net", feed: "https://www.meeza.net/category/news-and-press-releases/feed/", tier: 1, type: "primary", reliability: 92, region: "GCC", direct: true, allowedForAutoPublish: true, requiresCorroboration: true },

  // UAE / GCC primary sources monitored through GDELT until a stable feed or
  // sitemap adapter is added. They never become trusted merely because GDELT
  // found them; the final URL must match this registry.
  { source: "G42", domain: "g42.ai", tier: 1, type: "primary", reliability: 92, region: "UAE", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Core42", domain: "core42.ai", tier: 1, type: "primary", reliability: 92, region: "UAE", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Center3", domain: "center3.com", tier: 1, type: "primary", reliability: 92, region: "GCC", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "e&", domain: "eand.com", tier: 1, type: "primary", reliability: 90, region: "UAE", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Moro Hub", domain: "morohub.com", tier: 1, type: "primary", reliability: 90, region: "UAE", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Gulf Data Hub", domain: "gulfdatahub.ae", tier: 1, type: "primary", reliability: 88, region: "UAE", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "DataVolt", domain: "data-volt.com", tier: 1, type: "primary", reliability: 88, region: "GCC", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Khazna Data Centers legacy domain", domain: "khazna.ae", tier: 1, type: "primary", reliability: 90, region: "UAE", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Microsoft News", domain: "news.microsoft.com", tier: 1, type: "primary", reliability: 98, region: "GLOBAL", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "AWS News", domain: "aws.amazon.com", tier: 1, type: "primary", reliability: 98, region: "GLOBAL", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Google Cloud", domain: "cloud.google.com", tier: 1, type: "primary", reliability: 98, region: "GLOBAL", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Oracle Cloud", domain: "blogs.oracle.com", tier: 1, type: "primary", reliability: 97, region: "GLOBAL", direct: false, allowedForAutoPublish: true, requiresCorroboration: true },

  // Tier 2: useful corroboration and fast context. Direct XML feeds are
  // polled; paywalled/no-feed publishers remain discovery-only.
  { source: "Data Center Dynamics", domain: "datacenterdynamics.com", feed: "https://www.datacenterdynamics.com/en/rss/", tier: 2, type: "specialist_media", reliability: 92, region: "MENA", direct: true, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Data Center Knowledge", domain: "datacenterknowledge.com", feed: "https://www.datacenterknowledge.com/rss.xml", tier: 2, type: "specialist_media", reliability: 90, region: "MENA", direct: true, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Capacity Media", domain: "capacitymedia.com", feed: "https://www.capacitymedia.com/feed", tier: 2, type: "specialist_media", reliability: 88, region: "MENA", direct: true, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "The Register", domain: "theregister.com", feed: "https://www.theregister.com/data_centre/headlines.atom", tier: 2, type: "established_business_media", reliability: 86, region: "GLOBAL", direct: true, allowedForAutoPublish: true, requiresCorroboration: true },
  { source: "Reuters", domain: "reuters.com", tier: 2, type: "established_business_media", reliability: 96, region: "MENA", direct: false, allowedForAutoPublish: false, requiresCorroboration: true },
  { source: "MEED", domain: "meed.com", tier: 2, type: "established_business_media", reliability: 90, region: "GCC", direct: false, allowedForAutoPublish: false, requiresCorroboration: true },
  { source: "Gulf Business", domain: "gulfbusiness.com", tier: 2, type: "established_business_media", reliability: 84, region: "GCC", direct: false, allowedForAutoPublish: false, requiresCorroboration: true },
  { source: "Arabian Business", domain: "arabianbusiness.com", tier: 2, type: "established_business_media", reliability: 84, region: "GCC", direct: false, allowedForAutoPublish: false, requiresCorroboration: true },
  { source: "Zawya", domain: "zawya.com", tier: 2, type: "established_business_media", reliability: 84, region: "MENA", direct: false, allowedForAutoPublish: false, requiresCorroboration: true },
];

export const DIRECT_FEED_SOURCES = SOURCE_REGISTRY.filter((source) => source.direct && source.feed);

export function sourceForHost(hostname: string): SourcePolicy | null {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return SOURCE_REGISTRY.find((source) => host === source.domain || host.endsWith(`.${source.domain}`)) || null;
}
