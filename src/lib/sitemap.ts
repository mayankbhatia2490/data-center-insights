// Pure sitemap helpers shared by the build script, the rebuild/IndexNow script and the tests.

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const unescapeXml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export function buildUrlset(urls: SitemapUrl[]): string {
  const body = urls.map((u) =>
    [
      "  <url>",
      `    <loc>${escapeXml(u.loc)}</loc>`,
      u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
      u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : null,
      u.priority ? `    <priority>${u.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...body, "</urlset>", ""].join("\n");
}

export function buildSitemapIndex(children: { loc: string; lastmod?: string }[]): string {
  const body = children.map((c) =>
    ["  <sitemap>", `    <loc>${escapeXml(c.loc)}</loc>`, c.lastmod ? `    <lastmod>${c.lastmod}</lastmod>` : null, "  </sitemap>"]
      .filter(Boolean)
      .join("\n"),
  );
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...body, "</sitemapindex>", ""].join("\n");
}

export const isSitemapIndex = (xml: string) => /<sitemapindex[\s>]/.test(xml);

export function parseUrlset(xml: string): SitemapUrl[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: unescapeXml(m[1].match(/<loc>([^<]*)<\/loc>/)?.[1] ?? ""),
    lastmod: m[1].match(/<lastmod>([^<]*)<\/lastmod>/)?.[1],
  }));
}

export function parseSitemapIndex(xml: string): string[] {
  return [...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g)].map((m) => unescapeXml(m[1].match(/<loc>([^<]*)<\/loc>/)?.[1] ?? ""));
}

// URLs that are new, or whose lastmod changed, between two snapshots: what a search engine should be told about.
export function changedUrls(before: SitemapUrl[], after: SitemapUrl[]): string[] {
  const old = new Map(before.map((u) => [u.loc, u.lastmod]));
  return after.filter((u) => !old.has(u.loc) || old.get(u.loc) !== u.lastmod).map((u) => u.loc);
}

export const maxDate = (dates: (string | null | undefined)[]): string | undefined =>
  dates.filter((d): d is string => !!d).sort().at(-1);

// A page set is stale when the content marker the live build recorded differs from the database now.
export function isStale(liveMarker: string | null | undefined, currentMarker: string, force = false): boolean {
  return force || !liveMarker || liveMarker !== currentMarker;
}
