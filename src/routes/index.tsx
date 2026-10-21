import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, KeyRound, PartyPopper, Search, TreePalm } from "lucide-react";
import { fetchTrendingInLagos, fetchFeaturedStays } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PropertyCard, PropertyCardSkeleton } from "@/components/spaces/PropertyCard";
import { HomeHeader } from "@/components/spaces/HomeHeader";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spaceaeon — Elite stays, shortlets & experiences" },
      {
        name: "description",
        content:
          "Book elite stays, shortlets, event spaces and leisure experiences across Nigeria with Spaceaeon. Pay in Naira or USD.",
      },
      { property: "og:title", content: "Spaceaeon — Elite stays, shortlets & experiences" },
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
  { label: "Resort", sub: "Resorts & retreats", icon: TreePalm, type: "Resort" },
];

function HomePage() {
  const { user, loading } = useAuth();
  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const displayName = loading ? "there" : user?.email ? firstName || "there" : "Guest";
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [featured, setFeatured] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  // Helper to guard actions requiring authentication
  const handleProtectedAction = (action: () => void) => {
    const isGuest = !user || !user.email;
    if (isGuest) {
      setAuthModalOpen(true);
    } else {
      action();
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingHome(true);
        const [f, t] = await Promise.all([fetchFeaturedStays(), fetchTrendingInLagos()]);
        if (!mounted) return;
        setFeatured(Array.isArray(f) ? f : []);
        setTrending(Array.isArray(t) ? t : []);
      } catch (e) {
        if (mounted) {
          setFeatured([]);
          setTrending([]);
        }
      } finally {
        if (mounted) setLoadingHome(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="overflow-x-hidden pb-6">
      <HomeHeader />

      <div className="mx-auto w-full px-5 pt-6 md:px-10 md:pt-8">
        <section className="brand-surface rounded-3xl px-6 py-8 md:px-12 md:py-14">
          <h1 className="font-display text-3xl font-extrabold leading-[1.15] text-brand-foreground md:text-5xl">
            Find your next
            <br />
            elite escape, {displayName}.
          </h1>

          <button
            type="button"
            onClick={() => navigate({ to: "/search" })}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-4 text-left text-muted-foreground shadow-sm md:mt-10 md:px-6 md:py-5"
          >
            <Search className="size-5 shrink-0" />
            <span className="truncate text-sm md:text-lg">
              Search stays, shortlets, venues &amp; leisure experiences
            </span>
          </button>
        </section>
      </div>

      <div className="relative z-10 mx-auto mt-8 w-full space-y-10 px-5 md:mt-12 md:space-y-14 md:px-10">
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
            {loadingHome ? (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="w-72 shrink-0 snap-start md:w-96">
                  <div className="card-elevated overflow-hidden">
                    <div className="aspect-[4/3] animate-pulse bg-muted" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))
            ) : (featured ?? []).length === 0 ? (
              <div className="w-full">
                <div className="card-elevated flex items-center justify-center p-8 text-center">
                  <p className="font-display text-base font-semibold">No rooms available</p>
                </div>
              </div>
            ) : (
              (featured ?? []).map((p) => (
                <div
                  key={p.property_id ?? p.id}
                  className="w-72 shrink-0 snap-start md:w-96"
                >
                  <PropertyCard property={p} linkToSearch />
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-bold md:text-2xl">Trending in Lagos</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loadingHome ? (
              [0, 1, 2].map((i) => <PropertyCardSkeleton key={i} />)
            ) : (trending ?? []).length === 0 ? (
              <div className="col-span-full">
                <div className="card-elevated flex items-center justify-center p-8 text-center">
                  <p className="font-display text-base font-semibold">No rooms available</p>
                </div>
              </div>
            ) : (
              (trending ?? []).map((p) => <PropertyCard key={p.id} property={p} linkToSearch />)
            )}
          </div>
        </section>
      </div>

      <SignInRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}