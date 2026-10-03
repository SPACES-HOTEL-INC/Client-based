import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
    token: (search.token as string) || "",
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email, token } = useSearch({ from: "/reset-password" });

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Missing reset token. Please request password reset again.");
      navigate({ to: "/forgot-password" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          new_password: newPassword,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        if (data.detail && Array.isArray(data.detail)) {
          throw new Error(data.detail[0]?.msg || "Validation error");
        }
        throw new Error(data.detail || data.message || "Failed to reset password");
      }

      toast.success("Password reset successfully! Please log in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6 text-foreground">
      <button
        onClick={() => navigate({ to: "/forgot-password" })}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-foreground transition-colors hover:bg-accent/80"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mt-8 max-w-md mx-auto">
        <h1 className="font-display text-3xl font-extrabold">Reset Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a new password for account <span className="font-semibold text-foreground">{email || "associated with your request"}</span>.
        </p>

        <form onSubmit={handleResetPassword} className="mt-8 flex flex-col gap-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full rounded-xl border border-input bg-background p-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newPassword}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Back to{" "}
          <Link to="/login" className="font-bold text-foreground underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}