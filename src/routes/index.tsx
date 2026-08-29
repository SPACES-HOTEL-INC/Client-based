import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Building2, ChefHat, KeyRound, PartyPopper, Search, Star } from "lucide-react";
import { properties } from "@/lib/data";
import { formatMoney, useSpaces } from "@/lib/spaces-store";
import { PropertyCard } from "@/components/spaces/PropertyCard";
import { AuthDialog } from "@/components/spaces/AuthDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spaces — Elite stays, shortlets & experiences" },
      {
        name: "description",
        content:
          "Book elite stays, shortlets, event spaces and dining experiences across Nigeria with Spaces. Pay in Naira or USD.",
      },
      { property: "og:title", content: "Spaces — Elite stays, shortlets & experiences" },
      {
        property: "og:description",
        content: "Discover and book luxury shortlets, hotels, villas and event spaces across Nigeria.",
      },
    ],
  }),
  component: HomePage,
});

const services = [
  { label: "Stays", sub: "Hotels & luxury stays", icon: Building2, type: "Hotel" },
  { label: "Event Spaces", sub: "Halls & premium venues", icon: PartyPopper, type: "Event Space" },
  { label: "Shortlets", sub: "Serviced apartments", icon: KeyRound, type: "Shortlet" },
  { label: "Dining", sub: "Curated experiences", icon: ChefHat, type: "Dining" },
];

function HomePage() {
  const { user, currency } = useSpaces();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const featured = properties.slice(0, 4);

  return (
    <div className="overflow-x-hidden pb-6">
      <header className="brand-surface rounded-b-[2rem] px-5 pt-6 pb-16 md:mx-6 md:mt-6 md:rounded-[2rem] md:px-12 md:py-16">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-4 md:max-w-5xl">
          <div className="min-w-0">
            <p className="text-sm text-brand-foreground/70 md:text-base">
              Hello, {user.firstName}!
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-brand-foreground md:mt-3 md:text-5xl md:leading-[1.1]">
              Find your next
              <br />
              elite escape.
            </h1>
            <p className="mt-3 hidden max-w-lg text-brand-foreground/70 md:block">
              Hand-picked hotels, shortlets, villas and event spaces across Nigeria — booked in
              seconds, priced in Naira or Dollars.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <button
              type="button"
              aria-label="Notifications"
              className="grid size-10 place-items-center rounded-full bg-brand-foreground/10 text-brand-foreground"
            >
              <Bell className="size-5" />
            </button>
            {user.guest && (
              <Button
                variant="secondary"
                className="h-10 rounded-full px-4"
                onClick={() => setAuthOpen(true)}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate({ to: "/search" })}
          className="mx-auto mt-6 flex w-full max-w-3xl items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left text-muted-foreground shadow-sm md:mt-8 md:max-w-5xl md:rounded-full md:px-6 md:py-5"
        >
          <Search className="size-5 shrink-0" />
          <span className="truncate text-sm md:text-base">
            Search stays, shortlets, venues &amp; dining
          </span>
        </button>
      </header>

      <div className="relative z-10 mx-auto mt-6 max-w-3xl space-y-8 px-5 md:mt-10 md:max-w-6xl md:space-y-12 md:px-6">
        <section className="animate-rise-in">
          <h2 className="mb-3 font-display text-base font-semibold">What are you looking for?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {services.map(({ label, sub, icon: Icon, type }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate({ to: "/search", search: { type } })}
                className="card-elevated flex min-h-24 flex-col items-start gap-2 p-4 text-left transition-transform active:scale-[0.98]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-base font-semibold">Featured stays</h2>
            <Link to="/search" className="text-sm font-semibold text-primary">
              See all
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
            {featured.map((p) => (
              <Link
                key={p.id}
                to="/property/$id"
                params={{ id: p.id }}
                className="card-elevated w-64 shrink-0 snap-start overflow-hidden"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    loading="lazy"
                    width={1200}
                    height={800}
                    className="size-full object-cover"
                  />
                  <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-brand-foreground">
                    {formatMoney(p.price, currency)}
                    <span className="font-normal opacity-70">/night</span>
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-gold text-gold" /> {p.rating} · {p.city}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold">Trending in Lagos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(2, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
