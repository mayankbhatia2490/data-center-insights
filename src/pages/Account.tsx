import { Navigate, Link } from "react-router-dom";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const Account = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { isPremium, subscriptionStatus, isLoading: subLoading } = useSubscription();

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Seo title="Account — Data Center Pulse" description="Manage your Data Center Pulse account." path="/account" />
      <Header />

      <main className="container py-12 max-w-lg">
        <h1 className="text-2xl font-black tracking-tight mb-6">Your account</h1>

        {authLoading || subLoading ? (
          <div className="h-32 animate-pulse border border-border bg-card rounded-[4px]" />
        ) : (
          <div className="space-y-6">
            <div className="border border-border bg-card rounded-[4px] p-6">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-semibold">{user?.email}</p>
            </div>

            <div className="border border-border bg-card rounded-[4px] p-6">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-semibold">{isPremium ? "Premium" : "Free"}</p>
              {subscriptionStatus && (
                <p className="text-xs text-muted-foreground mt-1">Status: {subscriptionStatus}</p>
              )}
              {!isPremium && (
                <Button asChild size="sm" className="mt-4">
                  <Link to="/pricing">Upgrade to Premium</Link>
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Account;
