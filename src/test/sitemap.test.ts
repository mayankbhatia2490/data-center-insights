import { describe, expect, it } from "vitest";
import {
  buildSitemapIndex,
  buildUrlset,
  changedUrls,
  isSitemapIndex,
  isStale,
  maxDate,
  parseSitemapIndex,
  parseUrlset,
} from "@/lib/sitemap";

describe("sitemap files", () => {
  it("round-trips a urlset, escaping special characters", () => {
    const xml = buildUrlset([
      { loc: "https://example.com/a?x=1&y=2", lastmod: "2026-10-01", changefreq: "daily", priority: "0.5" },
      { loc: "https://example.com/b" },
    ]);
    expect(xml).toContain("&amp;");
    expect(parseUrlset(xml)).toEqual([
      { loc: "https://example.com/a?x=1&y=2", lastmod: "2026-10-01" },
      { loc: "https://example.com/b", lastmod: undefined },
    ]);
  });

  it("builds and parses an index, and tells the two kinds apart", () => {
    const index = buildSitemapIndex([
      { loc: "https://example.com/sitemap-news.xml", lastmod: "2026-10-01" },
      { loc: "https://example.com/sitemap-data.xml" },
    ]);
    expect(isSitemapIndex(index)).toBe(true);
    expect(isSitemapIndex(buildUrlset([]))).toBe(false);
    expect(parseSitemapIndex(index)).toEqual(["https://example.com/sitemap-news.xml", "https://example.com/sitemap-data.xml"]);
  });

  it("picks the newest date and ignores missing ones", () => {
    expect(maxDate(["2026-09-30", undefined, "2026-10-01", null])).toBe("2026-10-01");
    expect(maxDate([])).toBeUndefined();
  });
});

describe("what to tell search engines", () => {
  const before = [
    { loc: "https://example.com/a", lastmod: "2026-09-30" },
    { loc: "https://example.com/b", lastmod: "2026-09-30" },
  ];

  it("reports new URLs and URLs whose lastmod changed, and nothing else", () => {
    const after = [
      { loc: "https://example.com/a", lastmod: "2026-09-30" },
      { loc: "https://example.com/b", lastmod: "2026-10-01" },
      { loc: "https://example.com/c", lastmod: "2026-10-01" },
    ];
    expect(changedUrls(before, after)).toEqual(["https://example.com/b", "https://example.com/c"]);
    expect(changedUrls(before, before)).toEqual([]);
  });

  it("does not report URLs that were removed", () => {
    expect(changedUrls(before, [before[0]])).toEqual([]);
  });
});

describe("when to rebuild", () => {
  it("rebuilds when the marker differs, is missing, or a rebuild is forced", () => {
    expect(isStale("m1", "m1")).toBe(false);
    expect(isStale("m1", "m2")).toBe(true);
    expect(isStale(null, "m1")).toBe(true);
    expect(isStale(undefined, "m1")).toBe(true);
    expect(isStale("m1", "m1", true)).toBe(true);
  });
});
