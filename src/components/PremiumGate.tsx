import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface PremiumGateProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const PremiumGate = ({
  children,
  title = "Premium intelligence",
  description = "This section is part of the Data Center Pulse premium tier — deeper market signals, capacity data, and regional outlook for investors and operators.",
}: PremiumGateProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium, isLoading: subLoading } = useSubscription();

  if (authLoading || subLoading) {
    return <div className="border border-border bg-card rounded-[4px] p-6 h-40 animate-pulse" />;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="border border-border bg-card rounded-[4px] p-8 text-center space-y-3">
      <Lock className="h-8 w-8 text-primary mx-auto" />
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {user ? (
        <Button asChild>
          <Link to="/pricing">Upgrade to Premium</Link>
        </Button>
      ) : (
        <Button asChild>
          <Link to="/login">Sign in to upgrade</Link>
        </Button>
      )}
    </div>
  );
};

export default PremiumGate;
