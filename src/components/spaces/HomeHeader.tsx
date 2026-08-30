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
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8 md:py-7">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground md:text-base">
            {greeting()} · {user.guest ? "Guest" : "Member"}
          </p>
          <p className="mt-0.5 truncate font-display text-2xl font-bold tracking-tight md:text-3xl">
            Hello, {user.firstName}!
          </p>
        </div>
        <CurrencyToggle className="shrink-0" />
      </div>
    </header>
  );
}
