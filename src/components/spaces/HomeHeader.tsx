import { CurrencyToggle } from "@/components/spaces/CurrencyToggle";
import { useAuth } from "@/hooks/useAuth";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeHeader() {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user?.email);
  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const displayName = loading ? "there" : isAuthenticated ? firstName || "there" : "Guest";

  return (
    <header className="bg-background">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-5 pt-6 pb-2 md:px-10 md:pt-8 md:pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
            {greeting()}{!loading && ` · ${isAuthenticated ? "Member" : "Guest"}`}
          </p>
          <p className="mt-1 truncate font-display text-2xl font-bold tracking-tight md:text-4xl">
            Hello, {displayName}!
          </p>
        </div>
        <CurrencyToggle className="shrink-0" />
      </div>
    </header>
  );
}
