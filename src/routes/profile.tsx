import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Ticket,
  UserRound,
  Wallet,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";
import { useAuth } from "@/hooks/useAuth";
import { useSpaceaeon } from "@/lib/spaces-store";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Spaceaeon" },
      { name: "description", content: "Manage your Spaceaeon account, wallet, bank withdrawal details, and preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { bookings, favorites } = useSpaceaeon();
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Dialog States
  const [signInRequiredOpen, setSignInRequiredOpen] = useState(false);
  const [personalDetailsOpen, setPersonalDetailsOpen] = useState(false);

  // Form States
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const isGuest = !user || !user.email;
  const displayName = user?.full_name || (user?.email ? user.email.split("@")[0] : "Guest");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedUser = await res.json();
      updateUser(updatedUser);
      toast.success("Personal details updated successfully!");
      setPersonalDetailsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Could not update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionIntercept = (callback: () => void) => {
    if (isGuest) {
      setSignInRequiredOpen(true);
    } else {
      callback();
    }
  };

  return (
    <div className="pb-24">
      {/* Original Header Profile Section restored */}
      <header className="brand-surface rounded-b-[2rem] px-5 pt-8 pb-14">
        <div className="mx-auto flex max-w-5xl items-center gap-4 md:px-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-foreground/15 font-display text-2xl font-bold text-brand-foreground">
            {displayName ? displayName.charAt(0).toUpperCase() : "G"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold text-brand-foreground">
              {isGuest ? "Browsing as Guest" : displayName}
            </p>
            <p className="truncate text-sm text-brand-foreground/70">
              {isGuest ? "Sign in to unlock full features" : user.email}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-8 max-w-5xl space-y-5 px-5 md:px-10">
        {/* Quick Stats Bar */}
        <div className="card-elevated grid grid-cols-2 divide-x divide-border">
          <Stat label="Bookings" value={String(bookings.length)} icon={<Ticket className="size-4" />} />
          <Stat label="Saved Spaceaeon" value={String(favorites.length)} icon={<Heart className="size-4" />} />
        </div>

        {/* Account Settings Menu */}
        <section className="card-elevated divide-y divide-border">
          <Row
            icon={<UserRound className="size-4" />}
            label="Personal details"
            onClick={() => handleActionIntercept(() => {
              setFullName(user?.full_name || "");
              setPhone(user?.phone_number || "");
              setPersonalDetailsOpen(true);
            })}
          />
          <Row
            icon={<Wallet className="size-4" />}
            label="Wallet"
            onClick={() => handleActionIntercept(() => navigate({ to: "/wallet" }))}
          />
          <Link
            to="/bookings"
            onClick={(e) => {
              if (isGuest) {
                e.preventDefault();
                setSignInRequiredOpen(true);
              }
            }}
            className="block"
          >
            <Row icon={<Ticket className="size-4" />} label="Booking history" />
          </Link>
          <Row
            icon={<ShieldCheck className="size-4" />}
            label="Security & privacy"
            onClick={() => handleActionIntercept(() => toast.info("Security settings up to date."))}
          />
        </section>

        {/* Preferences Section */}
        <section className="card-elevated divide-y divide-border">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Globe className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Language</span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">English (US)</span>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <CreditCard className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Display currency</span>
            </span>
            <span className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold">
              {currency === "NGN" ? "₦ NGN" : "$ USD"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Bell className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Booking notifications</span>
            </span>
            <Switch defaultChecked onCheckedChange={(v) => toast.success(v ? "Notifications on" : "Notifications off")} />
          </div>
        </section>

        {/* Get Help, FAQs, and Legal Section */}
        <section className="card-elevated divide-y divide-border">
          <Link to="/help" className="block">
            <Row icon={<MessageCircle className="size-4" />} label="Get Help" />
          </Link>
          <Row
            icon={<HelpCircle className="size-4" />}
            label="FAQs"
            onClick={() => navigate({ to: "/faqs" })}
          />
          <Link to="/legal" className="block">
            <Row icon={<FileText className="size-4" />} label="Legal" />
          </Link>
        </section>

        {/* Direct Link to Login Page */}
        {isGuest ? (
          <Link
            to="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Sign In
          </Link>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-base text-destructive hover:text-destructive"
            onClick={() => {
              logout();
              toast.success("Signed out successfully");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">Spaceaeon · v1.0.0</p>
      </div>

      {/* MODALS */}
      <Dialog open={personalDetailsOpen} onOpenChange={setPersonalDetailsOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Personal Details</DialogTitle>
            <DialogDescription>Update your personal information below.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-4" onSubmit={handleUpdateProfile}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled className="h-11 rounded-xl bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="h-11 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={isUpdating} className="h-11 w-full rounded-xl flex items-center justify-center gap-2">
              {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action intercept modal when guest clicks restricted item */}
      <SignInRequiredModal isOpen={signInRequiredOpen} onClose={() => setSignInRequiredOpen(false)} />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </span>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Row({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">{icon}</span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}