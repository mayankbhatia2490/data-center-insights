import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";

type Status = "ready" | "loading" | "success" | "error";

// Confirming a subscription is the second half of double opt-in, so it only happens when the person
// clicks the button. Loading this page (including by an email scanner or link preview) does nothing.
const Confirm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "ready" : "error");
  const [message, setMessage] = useState(token ? "" : "Invalid confirmation link.");

  const doConfirm = async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm?token=${encodeURIComponent(token ?? "")}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const result = await res.json();
      const ok = res.ok && result.success;
      setStatus(ok ? "success" : "error");
      setMessage(result.message || result.error || (ok ? "Subscription confirmed." : "Something went wrong."));
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Seo
        title="Confirm subscription — Data Center Pulse"
        description="Confirm your Data Center Pulse subscription."
        path="/confirm"
        noindex
      />
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-bold">Confirm your subscription</h1>
        </div>

        {(status === "ready" || status === "loading") && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              One click to finish. Confirm that you want the daily Data Center Pulse briefing by email.
            </p>
            <Button onClick={doConfirm} disabled={status === "loading"} className="w-full">
              {status === "loading" ? "Confirming..." : "Confirm subscription"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Didn't sign up? Close this page and nothing will happen.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-positive mx-auto" />
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-sm text-muted-foreground">You'll receive the daily briefing every morning.</p>
            <Link to="/" className="text-primary text-sm hover:underline block mt-4">
              ← Back to Data Center Pulse
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-semibold">{message}</p>
            {token && (
              <Button variant="outline" onClick={doConfirm}>
                Try again
              </Button>
            )}
            <Link to="/" className="text-primary text-sm hover:underline block mt-4">
              ← Back to Data Center Pulse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Confirm;
