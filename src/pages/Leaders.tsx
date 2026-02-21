import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import NewsTicker from "@/components/NewsTicker";
import { Link } from "react-router-dom";
import { Users, Zap, ArrowLeft, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Leaders = () => {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");

  const { data: leaders, isLoading } = useQuery({
    queryKey: ["leaders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("id, name, title, organization, region, mention_count, importance_score, last_mentioned")
        .order("mention_count", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const regions = ["All", ...new Set((leaders || []).map((l) => l.region).filter(Boolean))];

  const filtered = (leaders || []).filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.organization || "").toLowerCase().includes(search.toLowerCase());
    const matchesRegion = regionFilter === "All" || l.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NewsTicker />

      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 no-underline">
            <ArrowLeft size={12} /> Back to Pulse
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Users size={24} className="text-primary" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">Industry Leaders</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-tracked executives, regulators, and key decision-makers mentioned in data center news.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-[4px]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r as string)}
                className={`rounded-[4px] px-3 py-1 text-xs font-medium transition-colors ${
                  regionFilter === r
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No leaders found</p>
            <p className="text-sm mt-1">People will appear here once the news pipeline extracts them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground">
                  <th className="text-left py-3 pr-4">#</th>
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4 hidden md:table-cell">Title</th>
                  <th className="text-left py-3 pr-4 hidden md:table-cell">Organization</th>
                  <th className="text-left py-3 pr-4 hidden lg:table-cell">Region</th>
                  <th className="text-right py-3 pr-4">Mentions</th>
                  <th className="text-right py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 pr-4 text-xs text-muted-foreground font-mono">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <Link
                        to={`/leaders/${l.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors no-underline"
                      >
                        {l.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{l.title}</td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{l.organization}</td>
                    <td className="py-3 pr-4 hidden lg:table-cell">
                      {l.region && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-[4px]">
                          {l.region}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs font-bold text-foreground">{l.mention_count}</td>
                    <td className="py-3 text-right text-xs text-muted-foreground">
                      {l.last_mentioned ? new Date(l.last_mentioned).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Data Center Pulse</span>
          </div>
          <span className="text-xs text-muted-foreground">© 2026 Data Center Pulse</span>
        </div>
      </footer>
    </div>
  );
};

export default Leaders;
