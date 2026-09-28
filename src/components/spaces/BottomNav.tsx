import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Home, Search, CalendarCheck, Headphones, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";

const items = [
  { to: "/", label: "Home", icon: Home, exact: true, protected: false },
  { to: "/search", label: "Search", icon: Search, exact: false, protected: false },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck, exact: false, protected: true },
  { to: "/support", label: "Support", icon: Headphones, exact: false, protected: true },
  { to: "/profile", label: "Profile", icon: User, exact: false, protected: false },
];

export function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Hide the navigation bar on auth-related pages
  const hiddenRoutes = ["/login", "/signup", "/register"];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const handleNavClick = (e: React.MouseEvent, item: (typeof items)[0]) => {
    // Check if user is unauthenticated trying to access protected tabs
    const isGuest = !user || !user.email;
    if (item.protected && isGuest) {
      e.preventDefault();
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:bottom-6 md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2 md:rounded-full md:border md:px-2"
        style={{ boxShadow: "var(--shadow-float)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2 md:gap-2 md:px-0">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  onClick={(e) => handleNavClick(e, item)}
                  className="group flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors data-[status=active]:text-primary md:flex-row md:gap-2 md:rounded-full md:px-5 md:py-2.5 md:data-[status=active]:bg-secondary"
                >
                  <Icon className="size-5" strokeWidth={2} />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SignInRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}