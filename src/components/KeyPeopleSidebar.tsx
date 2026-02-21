import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const KeyPeopleSidebar = () => {
  const { data: people, isLoading } = useQuery({
    queryKey: ["top-people-sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("id, name, title, organization, last_mentioned")
        .order("last_mentioned", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="border-b border-border pb-8 mb-8">
      <h3 className="flex items-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
        <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
        Key Leaders
      </h3>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : people && people.length > 0 ? (
        <div className="space-y-3">
          {people.map((p) => (
            <Link
              key={p.id}
              to={`/leaders/${p.id}`}
              className="block group no-underline"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users size={12} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">
                    {p.title}{p.organization ? `, ${p.organization}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          <Link
            to="/leaders"
            className="block text-[11px] font-medium text-primary hover:underline no-underline mt-2"
          >
            View all leaders →
          </Link>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No leaders tracked yet.</p>
      )}
    </div>
  );
};

export default KeyPeopleSidebar;
