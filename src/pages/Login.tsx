import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Mail, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Seo from "@/components/Seo";

const Login = () => {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);
    const { error: signInError } = await signInWithEmail(email);
    setIsLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Seo
        title="Sign In — Data Center Pulse"
        description="Sign in to Data Center Pulse to manage your subscription and claim your executive profile."
        path="/login"
      />
      <div className="max-w-md w-full">
        <div className="mb-6 text-center">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-bold">Sign in to Data Center Pulse</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No password needed — we'll email you a secure sign-in link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="h-12 w-12 text-accent mx-auto" />
            <p className="font-semibold">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <span className="font-medium">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending link..." : "Send sign-in link"}
            </Button>
          </form>
        )}

        <Link to="/" className="text-primary text-sm hover:underline block mt-6 text-center">
          ← Back to Data Center Pulse
        </Link>
      </div>
    </div>
  );
};

export default Login;
