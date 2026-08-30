import { Link } from "@tanstack/react-router";
import { Home, Search, CalendarCheck, Headphones, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/search", label: "Search", icon: Search, exact: false },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck, exact: false },
  { to: "/support", label: "Support", icon: Headphones, exact: false },
  { to: "/profile", label: "Profile", icon: User, exact: false },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:bottom-6 md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2 md:rounded-full md:border md:px-2"
      style={{ boxShadow: "var(--shadow-float)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2 md:gap-2 md:px-0">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="group flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors data-[status=active]:text-primary md:flex-row md:gap-2 md:rounded-full md:px-5 md:py-2.5 md:data-[status=active]:bg-secondary"
            >
              <Icon className="size-5" strokeWidth={2} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
