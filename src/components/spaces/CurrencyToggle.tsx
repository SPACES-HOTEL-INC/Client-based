import { useSpaces } from "@/lib/spaces-store";
import { cn } from "@/lib/utils";

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useSpaces();
  const options = [
    { key: "NGN" as const, label: "₦ NGN" },
    { key: "USD" as const, label: "$ USD" },
  ];
  return (
    <div className={cn("inline-flex rounded-full bg-secondary p-1", className)}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => setCurrency(o.key)}
          aria-pressed={currency === o.key}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
            currency === o.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
