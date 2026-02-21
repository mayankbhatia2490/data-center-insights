export interface Article {
  id: string;
  title: string;
  summary: string;
  category: "M&A" | "AI" | "Sustainability" | "Middle East" | "Policy";
  source: string;
  timestamp: string;
  imageUrl: string;
  readTime: string;
}

export const mockNews: Article[] = [
  {
    id: "1",
    title: "Blackstone Acquires $10B Data Center Portfolio in Europe",
    summary: "The asset management giant doubles down on digital infrastructure, acquiring a majority stake in several hyperscale facilities across Frankfurt and London.",
    category: "M&A",
    source: "Bloomberg",
    timestamp: "2 hours ago",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "2",
    title: "Dubai Internet City Expands Capacity by 500MW for AI Workloads",
    summary: "To meet the demands of regional LLM training, TECOM Group announces a massive expansion of their specialized data center zones.",
    category: "Middle East",
    source: "Gulf Business",
    timestamp: "4 hours ago",
    readTime: "3 min read",
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea932a23518?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "3",
    title: "NVIDIA Announces New Liquid Cooling Chips for High-Density Clusters",
    summary: "The new Grace Hopper superchips require advanced immersion cooling, shifting the standard for next-gen facility designs.",
    category: "AI",
    source: "TechCrunch",
    timestamp: "6 hours ago",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "4",
    title: "Google's 2030 Carbon-Free Goal Hits a Snag Amid AI Power Surge",
    summary: "Rising energy consumption from AI training models threatens the tech giant's sustainability milestones.",
    category: "Sustainability",
    source: "Reuters",
    timestamp: "8 hours ago",
    readTime: "6 min read",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "5",
    title: "Equinix Expands to Muscat, Oman with New IBX Center",
    summary: "Strengthening the digital bridge between Asia and Europe, the new facility focuses on subsea cable connectivity.",
    category: "Middle East",
    source: "Data Center Dynamics",
    timestamp: "12 hours ago",
    readTime: "3 min read",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef526b0042a0?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "6",
    title: "EU Passes Strict Energy Efficiency Standards for Data Centers",
    summary: "New regulations mandate PUE reporting and renewable energy usage for all facilities above 500kW within the European Union.",
    category: "Policy",
    source: "Financial Times",
    timestamp: "14 hours ago",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "7",
    title: "Microsoft and Brookfield Sign Largest-Ever Corporate PPA at 10.5GW",
    summary: "The landmark renewable energy deal will power Azure data centers globally through 2030 and beyond.",
    category: "Sustainability",
    source: "CNBC",
    timestamp: "1 day ago",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "8",
    title: "AWS Announces $7.8B Investment in Saudi Arabia Data Centers",
    summary: "Amazon Web Services plans three availability zones in Riyadh, marking its first infrastructure region in the Kingdom.",
    category: "Middle East",
    source: "Arabian Business",
    timestamp: "1 day ago",
    readTime: "3 min read",
    imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "9",
    title: "CoreWeave IPO Valued at $35B as AI Infrastructure Demand Soars",
    summary: "The GPU cloud provider's public debut reflects Wall Street's bullish stance on specialized AI compute infrastructure.",
    category: "M&A",
    source: "Wall Street Journal",
    timestamp: "2 days ago",
    readTime: "6 min read",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "10",
    title: "DeepMind's New Model Optimizes Data Center Cooling by 40%",
    summary: "Google's AI subsidiary deploys reinforcement learning agents that dynamically adjust HVAC systems in real time.",
    category: "AI",
    source: "Wired",
    timestamp: "2 days ago",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
  },
];

export const trendingStories = [
  { id: "1", title: "Blackstone's $10B European data center play signals new era", category: "M&A" as const },
  { id: "3", title: "Why liquid cooling is now mandatory for AI racks", category: "AI" as const },
  { id: "2", title: "Dubai's 500MW expansion: What it means for the region", category: "Middle East" as const },
  { id: "9", title: "CoreWeave IPO: The GPU cloud bet that paid off", category: "M&A" as const },
  { id: "4", title: "Big Tech's green promises vs. AI power reality", category: "Sustainability" as const },
];

export const marketTickers = [
  { symbol: "EQIX", name: "Equinix", price: "845.20", change: "+1.2%", status: "up" as const },
  { symbol: "DLR", name: "Digital Realty", price: "132.50", change: "-0.4%", status: "down" as const },
  { symbol: "IRM", name: "Iron Mountain", price: "76.80", change: "+0.8%", status: "up" as const },
  { symbol: "QTS", name: "QTS Realty", price: "214.30", change: "+2.1%", status: "up" as const },
];

export const upcomingEvents = [
  { name: "GITEX Global 2026", location: "Dubai World Trade Centre", date: "Oct 14-18" },
  { name: "Capacity Middle East", location: "Grand Hyatt Dubai", date: "Feb 06-08" },
  { name: "Data Center World", location: "London, UK", date: "Mar 12-13" },
];

export const categoryColors: Record<string, string> = {
  "M&A": "category-ma",
  "AI": "category-ai",
  "Sustainability": "category-green",
  "Middle East": "category-me",
  "Policy": "category-policy",
};
