import { CurrencyToggle } from "@/components/spaces/CurrencyToggle";
import { useSpaces } from "@/lib/spaces-store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeHeader() {
  const { user } = useSpaces();

  return (
    <header className="bg-background">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-5 pt-6 pb-2 md:px-10 md:pt-8 md:pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
            {greeting()} · {user.guest ? "Guest" : "Member"}
          </p>
          <p className="mt-1 truncate font-display text-2xl font-bold tracking-tight md:text-4xl">
            Hello, {user.firstName}!
          </p>
        </div>
        <CurrencyToggle className="shrink-0" />
      </div>
    </header>
  );
}
