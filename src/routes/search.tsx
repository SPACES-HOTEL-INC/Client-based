import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, LayoutGrid, SlidersHorizontal, Search as SearchIcon, X } from "lucide-react";
import { AMENITIES, PROPERTY_TYPES, type Property } from "@/lib/data";
import { searchRooms } from "@/lib/api";
import { formatMoney, useSpaces } from "@/lib/spaces-store";
import { PropertyCard, PropertyCardSkeleton } from "@/components/spaces/PropertyCard";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";

type SearchParams = { type?: string | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    type: typeof search["type"] === "string" ? (search["type"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search stays & spaces — Spaces" },
      {
        name: "description",
        content: "Filter luxury stays, shortlets, villas, resorts and event spaces by price, rating and amenities.",
      },
      { property: "og:title", content: "Search stays & spaces — Spaces" },
      { property: "og:description", content: "Find the perfect stay with price, type, rating and amenity filters." },
    ],
  }),
  component: SearchPage,
});

const MAX_PRICE = 1000000;

function SearchPage() {
  const { type } = Route.useSearch();
  const { currency } = useSpaces();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const initialSearchParams = (() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const q = qs.get("city") ?? qs.get("query") ?? "";
      const maxPrice = qs.get("max_price") ?? qs.get("maxPrice") ?? null;
      const pt = qs.get("property_type") ?? undefined;
      return { q: q as string, maxPrice: maxPrice ? Number(maxPrice) : null, pt };
    } catch (e) {
      return { q: "", maxPrice: null, pt: undefined };
    }
  })();

  const [query, setQuery] = useState(initialSearchParams.q ?? "");
  const [price, setPrice] = useState<number[]>([initialSearchParams.maxPrice ?? MAX_PRICE]);
  const [types, setTypes] = useState<string[]>(type ? [type] : initialSearchParams.pt ? [initialSearchParams.pt] : []);
  const [minRating, setMinRating] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  // Debounced filter state to avoid firing API on every change
  const [debouncedFilters, setDebouncedFilters] = useState(() => ({
    query: initialSearchParams.q ?? "",
    price: [initialSearchParams.maxPrice ?? MAX_PRICE] as number[],
    types: type ? [type] : initialSearchParams.pt ? [initialSearchParams.pt] : ([] as string[]),
  }));
  const [view, setView] = useState<"grid" | "map">("grid");

  // remove artificial loading delay; loading is controlled by fetch lifecycle

  // debounce filters (query, price, types) before hitting API
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({ query, price, types });
    }, 350);
    return () => clearTimeout(handler);
  }, [query, price, types]);
  // Update results when debounced filters change (user interactions and initial mount)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const filters: Record<string, any> = {};
        if (debouncedFilters.query) filters.city = debouncedFilters.query;
        if (debouncedFilters.price?.[0]) filters.max_price = debouncedFilters.price[0];
        if (debouncedFilters.types && debouncedFilters.types.length === 1) filters.property_type = debouncedFilters.types[0];
        // backend will handle city, max_price, property_type and limit
        const res = await searchRooms({ city: filters.city, max_price: filters.max_price, property_type: filters.property_type });
        if (!mounted) return;
        setProperties(res ?? []);
      } catch (e) {
        if (mounted) setProperties([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedFilters]);

  useEffect(() => {
    if (type) setTypes([type]);
  }, [type]);

  const results = useMemo(
    () =>
      properties.filter((p) => {
        const q = query.trim().toLowerCase();
        const title = (p.title ?? "").toString().toLowerCase();
        const city = (p.city ?? "").toString().toLowerCase();
        const stateVal = (p.state ?? "").toString().toLowerCase();
        const matchQuery = !q || title.includes(q) || city.includes(q) || stateVal.includes(q);

        const pType = (p.type ?? (p as any).property_type ?? "").toString();
        const matchType = types.length === 0 || types.includes(pType);

        const pPrice = Number((p.price ?? (p as any).price_per_night ?? 0) as number) || 0;
        const matchPrice = pPrice <= (price[0] ?? MAX_PRICE);

        const pRating = Number((p.rating ?? (p as any).avg_rating ?? 0) as number) || 0;
        const matchRating = pRating >= minRating;

        const pAmenities = Array.isArray(p.amenities) ? p.amenities : [];
        const matchAmenities = amenities.every((a) => pAmenities.includes(a));

        return matchQuery && matchType && matchPrice && matchRating && matchAmenities;
      }),
    [query, types, price, minRating, amenities, properties],
  );

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const clearAll = () => {
    setTypes([]);
    setAmenities([]);
    setMinRating(0);
    setPrice([MAX_PRICE]);
  };

  const activeFilters = types.length + amenities.length + (minRating > 0 ? 1 : 0);

  const Filters = (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm font-semibold">Price per night</Label>
          <span className="text-sm text-muted-foreground">up to {formatMoney(price[0] ?? 0, currency)}</span>
        </div>
        <Slider min={40000} max={MAX_PRICE} step={10000} value={price} onValueChange={setPrice} />
      </div>

      <div>
        <Label className="mb-3 block text-sm font-semibold">Property type</Label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(types, setTypes, t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                types.includes(t) ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block text-sm font-semibold">Star rating</Label>
        <div className="flex gap-2">
          {[0, 4, 4.5, 4.8].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
                minRating === r ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block text-sm font-semibold">Amenities</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={amenities.includes(a)}
                onCheckedChange={() => toggle(amenities, setAmenities, a)}
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full rounded-xl" onClick={clearAll}>
        Clear filters
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full px-5 pt-6 md:px-10">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-sm">
          <SearchIcon className="size-4.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destination or space"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              aria-label="Filters"
              className="relative size-12 shrink-0 rounded-full lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              {activeFilters > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">{Filters}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
        <button
          type="button"
          onClick={() => setTypes([])}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            types.length === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
          }`}
        >
          All
        </button>
        {PROPERTY_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypes([t])}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              types.includes(t) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <p className="truncate text-sm text-muted-foreground">
          {loading ? "Searching…" : `${results.length} space${results.length === 1 ? "" : "s"} found`}
        </p>
        <div className="flex shrink-0 items-center gap-2">

          <div className="inline-flex rounded-full bg-secondary p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`grid size-9 place-items-center rounded-full ${view === "grid" ? "bg-card shadow-sm" : ""}`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              aria-label="Map view"
              className={`grid size-9 place-items-center rounded-full ${view === "map" ? "bg-card shadow-sm" : ""}`}
            >
              <MapIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">{Filters}</aside>

        <div className="min-w-0 flex-1">
          {view === "map" ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-accent/40 sm:aspect-[16/10]">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:36px_36px]" />
              {results.map((p) => (
                <Link
                  key={p.id}
                  to="/property/$id"
                  params={{ id: p.id }}
                  style={{ left: `${p.coords.x}%`, top: `${p.coords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105"
                >
                  {formatMoney(p.price, currency)}
                </Link>
              ))}
              {results.length === 0 && (
                <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                  No spaces on the map for these filters
                </p>
              )}
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card-elevated flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
                <SearchIcon className="size-6" />
              </span>
              <p className="font-display text-lg font-semibold">No rooms available</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Try widening your price range or clearing a few amenities.
              </p>
              <Button variant="outline" className="rounded-xl" onClick={clearAll}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
