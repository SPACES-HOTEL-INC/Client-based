import { ArchMark } from "@/components/spaces/Logo";
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-5">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <ArchMark className="size-11 shrink-0 rounded-2xl md:size-14" />
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground md:text-base">
              {greeting()} · {user.guest ? "Guest" : "Member"}
            </p>
            <p className="truncate font-display text-lg font-bold tracking-tight md:text-2xl">
              Hello, {user.firstName}!
            </p>
          </div>
        </div>
        <CurrencyToggle className="shrink-0" />
      </div>
    </header>
  );
}
