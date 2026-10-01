import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";

type Status = "ready" | "loading" | "success" | "error";

// Unsubscribing changes data, so it only happens when the person clicks the button. Loading this page
// (including by an email scanner or link preview) does nothing.
const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "ready" : "error");
  const [message, setMessage] = useState(token ? "" : "Invalid unsubscribe link.");

  const doUnsubscribe = async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe?token=${encodeURIComponent(token ?? "")}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const result = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(result.message || "You've been unsubscribed.");
      } else {
        setStatus("error");
        setMessage(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Seo
        title="Unsubscribe — Data Center Pulse"
        description="Manage your Data Center Pulse subscription."
        path="/unsubscribe"
        noindex
      />
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-bold">Unsubscribe from Data Center Pulse</h1>
        </div>

        {(status === "ready" || status === "loading") && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Confirm that you want to stop receiving the daily briefing. We will remove your email address from our list.
            </p>
            <Button onClick={doUnsubscribe} disabled={status === "loading"} className="w-full">
              {status === "loading" ? "Unsubscribing..." : "Confirm unsubscribe"}
            </Button>
            <Link to="/" className="text-primary text-sm hover:underline block mt-4">
              Keep me subscribed
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-accent mx-auto" />
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-sm text-muted-foreground">We're sorry to see you go.</p>
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
              <Button variant="outline" onClick={doUnsubscribe}>
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

export default Unsubscribe;
