import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

const Confirm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid confirmation link.");
      return;
    }

    const doConfirm = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm?token=${token}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        const result = await res.json();
        setStatus(result.success ? "success" : "error");
        setMessage(result.message || (result.success ? "Subscription confirmed." : "Something went wrong."));
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    doConfirm();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-bold">Confirm your subscription</h1>
        </div>

        {status === "loading" && (
          <p className="text-muted-foreground">Confirming your subscription...</p>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-accent mx-auto" />
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
