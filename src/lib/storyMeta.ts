import type { Article } from "@/hooks/useArticles";
import { stripHtml } from "@/lib/stripHtml";

// Labels follow docs/reliable-news-validation.md: Tier 1 is an official announcement, Tier 2 is
// specialist media. Anything else gets no label rather than a guess.
export function sourceKind(tier: number | null | undefined): string | null {
  if (tier === 1) return "Official announcement";
  if (tier === 2) return "Reported by specialist media";
  return null;
}

export function validationLabel(status: string | null | undefined): string | null {
  switch (status) {
    case "validated_primary":
      return "Passed source and editorial checks (official source)";
    case "validated_specialist":
      return "Passed source and editorial checks (specialist media)";
    default:
      return null;
  }
}

export function storyPath(slug: string) {
  return `/news/${slug}`;
}

export function storyDescription(article: Pick<Article, "summary" | "title">, max = 155): string {
  const text = stripHtml(article.summary) || article.title;
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function buildStoryJsonLd(article: Article, siteUrl: string, siteName: string) {
  const url = `${siteUrl}${storyPath(article.slug ?? "")}`;
  const orgs = article.named_entities?.organizations ?? [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: storyDescription(article, 300),
      url,
      mainEntityOfPage: url,
      datePublished: article.published_at ?? article.created_at,
      dateModified: article.updated_at ?? article.published_at ?? article.created_at,
      ...(article.image_url ? { image: [article.image_url] } : {}),
      author: { "@type": "Organization", name: siteName, url: `${siteUrl}/` },
      publisher: { "@type": "Organization", name: siteName, url: `${siteUrl}/` },
      ...(article.source_url ? { isBasedOn: article.source_url } : {}),
      ...(article.category ? { articleSection: article.category } : {}),
      ...(orgs.length ? { about: orgs.map((name) => ({ "@type": "Organization", name })) } : {}),
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "News", item: `${siteUrl}/news` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ];
}
