import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = null;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        if (data?.detail && Array.isArray(data.detail)) {
          throw new Error(data.detail[0]?.msg || "Validation error");
        }
        throw new Error(data?.detail || "Failed to generate reset token");
      }

      // The token is returned directly in response body (string or object key)
      const token = typeof data === "string" ? data : data?.token || data?.access_token;

      toast.success("Reset token generated successfully!");

      // Navigate to reset-password with email & token in search params
      navigate({
        to: "/reset-password",
        search: { email: email.trim(), token },
      });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6 text-foreground">
      <button
        onClick={() => navigate({ to: "/login" })}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-foreground transition-colors hover:bg-accent/80"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mt-8 max-w-md mx-auto">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
          <KeyRound className="h-6 w-6" />
        </div>

        <h1 className="font-display text-3xl font-extrabold">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email address below to generate a password reset request.
        </p>

        <form onSubmit={handleRequestReset} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="mt-1 w-full rounded-xl border border-input bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue to Reset"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-bold text-foreground underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}