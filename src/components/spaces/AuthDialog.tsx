import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArchMark } from "./Logo";
import { useSpaces } from "@/lib/spaces-store";
import { toast } from "sonner";

type Mode = "login" | "signup" | "otp";

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { signIn } = useSpaces();
  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setMode("login");
      setOtp("");
      setPassword("");
    }, 200);
  };

  const submitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setMode("otp");
      toast.success(`Verification code sent to ${email}`, { description: "Demo code: 123456" });
    }, 700);
  };

  const verify = () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    const name = firstName.trim() || (email.split("@")[0] ?? "").replace(/[^a-zA-Z]/g, "") || "Guest";
    const pretty = name.charAt(0).toUpperCase() + name.slice(1);
    signIn(pretty, email);
    toast.success(`Welcome, ${pretty}!`);
    close();
  };


  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <div className="brand-surface px-6 pt-7 pb-8">
          <ArchMark className="h-12 w-12" />
          <DialogHeader className="mt-4 space-y-1 text-left">
            <DialogTitle className="text-2xl text-brand-foreground">
              {mode === "otp" ? "Verify your email" : mode === "login" ? "Welcome back" : "Create your account"}
            </DialogTitle>
            <DialogDescription className="text-brand-foreground/70">
              {mode === "otp"
                ? `We sent a 6-digit code to ${email}`
                : "Elite stays, shortlets & experiences across Nigeria."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-5">
          {mode === "otp" ? (
            <div className="space-y-5">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button className="h-12 w-full rounded-xl text-base" onClick={verify}>
                Verify &amp; continue
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submitCredentials}>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Abubakar"
                    className="h-12 rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl"
                />
              </div>
              <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">
                {busy ? "Sending code…" : mode === "login" ? "Continue" : "Create account"}
              </Button>
            </form>
          )}

          {mode !== "otp" && (
            <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="h-12 w-full rounded-xl" onClick={close}>
                Continue as guest
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? "New to Spaces?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
