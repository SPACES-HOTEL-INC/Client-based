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
      <HomeHeader />

      <div className="mx-auto max-w-6xl px-5 pt-5 md:px-8 md:pt-8">
        <section className="brand-surface rounded-3xl px-6 py-8 md:px-12 md:py-14">
          <h1 className="font-display text-3xl font-extrabold leading-[1.15] text-brand-foreground md:text-5xl">
            Find your next
            <br />
            elite escape, {user.firstName}.
          </h1>

          <button
            type="button"
            onClick={() => navigate({ to: "/search" })}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-4 text-left text-muted-foreground shadow-sm md:mt-10 md:px-6 md:py-5"
          >
            <Search className="size-5 shrink-0" />
            <span className="truncate text-sm md:text-lg">
              Search stays, shortlets, venues &amp; dining
            </span>
          </button>
        </section>
      </div>

      <div className="relative z-10 mx-auto mt-8 max-w-6xl space-y-10 px-5 md:mt-12 md:space-y-14 md:px-8">
        <section className="animate-rise-in">
          <h2 className="mb-4 font-display text-xl font-bold md:text-2xl">
            What are you looking for?
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {services.map(({ label, sub, icon: Icon, type }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate({ to: "/search", search: { type } })}
                className="flex min-h-32 flex-col items-start justify-between gap-4 rounded-3xl border border-border bg-card p-5 text-left transition-all hover:shadow-md active:scale-[0.98] md:min-h-44 md:p-6"
              >
                <Icon className="size-7 text-primary md:size-8" strokeWidth={1.75} />
                <span>
                  <span className="block font-display text-base font-bold md:text-xl">{label}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground md:text-base">
                    {sub}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold md:text-2xl">Featured stays</h2>
            <Link to="/search" className="flex items-center gap-1.5 text-sm font-semibold text-teal">
              See all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
            {featured.map((p) => (
              <Link
                key={p.id}
                to="/property/$id"
                params={{ id: p.id }}
                className="card-elevated w-72 shrink-0 snap-start overflow-hidden md:w-96"
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
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-sm font-semibold text-brand-foreground">
                    <Star className="size-4 fill-gold text-gold" /> {p.rating}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1.5 text-sm font-semibold text-brand-foreground">
                    {formatMoney(p.price, currency)}
                    <span className="font-normal opacity-70">/night</span>
                  </span>
                </div>
                <div className="space-y-1 p-4">
                  <p className="line-clamp-1 font-display text-base font-semibold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.city} · {p.state}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-bold md:text-2xl">Trending in Lagos</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
