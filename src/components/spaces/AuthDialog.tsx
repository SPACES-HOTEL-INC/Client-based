import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArchMark } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";

type Mode = "login" | "signup";

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setMode("login");
      setPassword("");
    }, 200);
  };

  const submitCredentials = async (e: React.FormEvent) => {
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

    try {
      if (mode === "signup") {
        // Register standard FastAPI / Backend user payload
        await api.post("/api/v1/auth/register", {
          email,
          password,
          full_name: firstName,
          phone_number: phone,
        });
        toast.success("Account created successfully!");
      }

      // Login request (FastAPI OAuth2 standard uses form data or JSON with username/email)
      const loginRes = await api.post("/api/v1/auth/login", {
        username: email,
        email,
        password,
      });

      const token = loginRes.data.access_token || loginRes.data.token;
      if (!token) {
        throw new Error("No access token returned from server.");
      }

      // Store token and update user state via useAuth
      await login(token);

      toast.success(mode === "signup" ? "Signed up and logged in!" : "Welcome back!");
      close();
    } catch (err: any) {
      console.error("Auth error:", err);
      const message = err.response?.data?.detail || "Authentication failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <div className="brand-surface px-6 pt-7 pb-8">
          <ArchMark className="h-12 w-12" />
          <DialogHeader className="mt-4 space-y-1 text-left">
            <DialogTitle className="text-2xl text-brand-foreground">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </DialogTitle>
            <DialogDescription className="text-brand-foreground/70">
              Elite stays, shortlets &amp; experiences across Nigeria.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-5">
          <form className="space-y-4" onSubmit={submitCredentials}>
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Full Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Abubakar Samuel"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="h-12 rounded-xl"
                  />
                </div>
              </>
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
                required
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
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">
              {busy ? "Processing…" : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}