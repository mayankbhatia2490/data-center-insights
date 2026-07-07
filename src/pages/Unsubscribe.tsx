import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }

    const doUnsubscribe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("unsubscribe", {
          body: {},
          headers: {},
          method: "POST",
        });

        // Use GET with query params instead
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe?token=${token}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        const result = await res.json();

        if (result.success) {
          setStatus("success");
          setMessage("You've been unsubscribed successfully.");
        } else {
          setStatus("success");
          setMessage(result.message || "You've been unsubscribed.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    doUnsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-bold">Unsubscribe from Data Center Pulse</h1>
        </div>

        {status === "loading" && (
          <p className="text-muted-foreground">Processing your request...</p>
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
