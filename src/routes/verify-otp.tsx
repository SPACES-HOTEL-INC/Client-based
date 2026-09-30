import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/verify-otp" });

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    setOtp(pastedData.split(""));
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp_code: code,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Verification failed");
      }

      toast.success("Account verified successfully!");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to verify code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);

    try {
      const response = await fetch("/api/v1/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Could not resend OTP");
      }

      toast.success("A new 6-digit code has been sent to your email!");
      setTimer(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6 text-foreground">
      <button
        onClick={() => navigate({ to: "/signup" })}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-foreground transition-colors hover:bg-accent/80"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mt-8 max-w-md mx-auto">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-extrabold">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{email || "your email"}</span>.
        </p>

        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-6">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border border-input bg-background text-center text-xl sm:text-2xl font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.join("").length < 6}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Didn't receive code?{" "}
          {timer > 0 ? (
            <span className="font-semibold text-foreground">Resend in {timer}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-bold text-foreground underline disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}