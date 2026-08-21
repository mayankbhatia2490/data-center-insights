import { BadgeCheck, Sparkles, Link2 } from "lucide-react";

export type ConfidenceTier = "sourced" | "ai_inferred" | "verified";

const config: Record<ConfidenceTier, { label: string; icon: typeof Sparkles; className: string }> = {
  sourced: { label: "Sourced", icon: Link2, className: "bg-primary/10 text-primary" },
  ai_inferred: { label: "AI-inferred", icon: Sparkles, className: "bg-secondary text-muted-foreground" },
  verified: { label: "Verified", icon: BadgeCheck, className: "bg-accent/10 text-accent" },
};

interface ConfidenceBadgeProps {
  tier?: string | null;
  sourceCount?: number;
  className?: string;
}

const ConfidenceBadge = ({ tier, sourceCount, className = "" }: ConfidenceBadgeProps) => {
  const resolved = (tier && config[tier as ConfidenceTier]) || config.ai_inferred;
  const Icon = resolved.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[1px] px-1.5 py-0.5 rounded-[2px] ${resolved.className} ${className}`}
      title={sourceCount ? `Generated from ${sourceCount} source article${sourceCount === 1 ? "" : "s"}` : undefined}
    >
      <Icon size={9} />
      {resolved.label}
      {sourceCount ? ` · ${sourceCount}` : ""}
    </span>
  );
};

export default ConfidenceBadge;
