import { describe, expect, it } from "vitest";
import { buildStoryJsonLd, sourceKind, storyDescription, storyPath, validationLabel } from "@/lib/storyMeta";
import type { Article } from "@/hooks/useArticles";

const article: Article = {
  id: "1",
  slug: "vdura-gallops-f86b9834",
  title: "VDURA gallops into the Neocloud market",
  summary: "<p>VDURA is entering the market.</p>",
  category: "AI",
  source: "Blocks & Files",
  source_url: "https://example.com/original",
  image_url: null,
  published_at: "2026-09-30T15:49:16+00:00",
  updated_at: "2026-10-01T08:00:00+00:00",
  read_time: null,
  created_at: "2026-09-30T15:50:00+00:00",
  sentiment: null,
  insight: null,
  source_excerpt: null,
  named_entities: { organizations: ["VDURA"], places: [] },
};

describe("storyMeta", () => {
  it("labels source tiers as the validation doc defines them and does not guess others", () => {
    expect(sourceKind(1)).toBe("Official announcement");
    expect(sourceKind(2)).toBe("Reported by specialist media");
    expect(sourceKind(null)).toBeNull();
    expect(sourceKind(3)).toBeNull();
  });

  it("only labels statuses that mean the story passed checks", () => {
    expect(validationLabel("validated_specialist")).toMatch(/Passed/);
    expect(validationLabel("legacy_unvalidated")).toBeNull();
    expect(validationLabel("rejected")).toBeNull();
  });

  it("builds the story path and a clean, bounded description", () => {
    expect(storyPath("abc")).toBe("/news/abc");
    expect(storyDescription(article)).toBe("VDURA is entering the market.");
    const long = { ...article, summary: "word ".repeat(100) };
    expect(storyDescription(long).length).toBeLessThanOrEqual(155);
    expect(storyDescription({ ...article, summary: null })).toBe(article.title);
  });

  it("emits NewsArticle and breadcrumb JSON-LD with the canonical story URL", () => {
    const [news, crumbs] = buildStoryJsonLd(article, "https://example.com", "Data Center Pulse") as unknown as [Record<string, unknown>, { itemListElement: unknown[] }];
    expect(news["@type"]).toBe("NewsArticle");
    expect(news.url).toBe("https://example.com/news/vdura-gallops-f86b9834");
    expect(news.dateModified).toBe("2026-10-01T08:00:00+00:00");
    expect(news.isBasedOn).toBe("https://example.com/original");
    expect(news.about).toEqual([{ "@type": "Organization", name: "VDURA" }]);
    expect(news).not.toHaveProperty("image");
    expect(crumbs.itemListElement).toHaveLength(3);
  });
});
