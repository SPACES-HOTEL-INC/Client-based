import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, ChevronRight, Heart, LogOut, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CurrencyToggle } from "@/components/spaces/CurrencyToggle";
import { AuthDialog } from "@/components/spaces/AuthDialog";
import { useSpaces } from "@/lib/spaces-store";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Spaces" },
      { name: "description", content: "Manage your Spaces account, currency preference, saved spaces and booking history." },
      { property: "og:title", content: "Your profile — Spaces" },
      { property: "og:description", content: "Account settings, dual currency toggle and booking history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, bookings, favorites, signOut } = useSpaces();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="pb-6">
      <header className="brand-surface rounded-b-[2rem] px-5 pt-8 pb-14">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-foreground/15 font-display text-2xl font-bold text-brand-foreground">
            {user.firstName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold text-brand-foreground">{user.firstName}</p>
            <p className="truncate text-sm text-brand-foreground/70">
              {user.guest ? "Browsing as guest" : user.email}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-8 max-w-3xl space-y-5 px-5">
        <div className="card-elevated grid grid-cols-2 divide-x divide-border">
          <Stat label="Bookings" value={String(bookings.length)} icon={<Ticket className="size-4" />} />
          <Stat label="Saved spaces" value={String(favorites.length)} icon={<Heart className="size-4" />} />
        </div>

        <section className="card-elevated space-y-4 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="font-semibold">Display currency</p>
              <p className="text-sm text-muted-foreground">Applies to all rates and totals</p>
            </div>
            <CurrencyToggle />
          </div>
        </section>

        <section className="card-elevated divide-y divide-border">
          <Row icon={<UserRound className="size-4" />} label="Personal details" />
          <Link to="/bookings" className="block">
            <Row icon={<Ticket className="size-4" />} label="Booking history" />
          </Link>
          <Row icon={<ShieldCheck className="size-4" />} label="Security & privacy" />
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

        {user.guest ? (
          <Button className="h-12 w-full rounded-xl text-base" onClick={() => setAuthOpen(true)}>
            Sign in or create an account
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
            onClick={() => {
              signOut();
              toast.success("Signed out");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">Spaces · v1.0.0</p>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
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

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">{icon}</span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
