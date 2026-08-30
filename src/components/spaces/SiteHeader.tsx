import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ArchMark } from "@/components/spaces/Logo";
import { CurrencyToggle } from "@/components/spaces/CurrencyToggle";
import { AuthDialog } from "@/components/spaces/AuthDialog";
import { Button } from "@/components/ui/button";
import { useSpaces } from "@/lib/spaces-store";

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/search", label: "Explore", exact: false },
  { to: "/bookings", label: "Bookings", exact: false },
  { to: "/support", label: "Support", exact: false },
  { to: "/profile", label: "Profile", exact: false },
];

export function SiteHeader() {
  const { user } = useSpaces();
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/") return null;

  return (
    <header className="hidden border-b border-border bg-card md:block">

      <div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-6 lg:gap-8 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <ArchMark className="h-9 w-9" />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Spaces
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <CurrencyToggle className="hidden lg:inline-flex" />
          {user.guest ? (
            <Button className="h-10 rounded-full px-5" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-1.5 pr-4"
            >
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.firstName.charAt(0)}
              </span>
              <span className="text-sm font-semibold">{user.firstName}</span>
            </Link>
          )}
        </div>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
