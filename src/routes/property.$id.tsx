import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  ChevronLeft,
  ChevronRight,
  Heart,
  Images,
  MapPin,
  Maximize,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { getProperty, type Room } from "@/lib/data";
import { formatMoney, useSpaces } from "@/lib/spaces-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookingDialog } from "@/components/spaces/BookingDialog";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/property/$id")({
  loader: ({ params }) => {
    const property = getProperty(params.id);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Space unavailable — Spaces" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.property;
    const title = `${p.title} — Spaces`;
    const description = `${p.type} in ${p.city}, ${p.state}. Rated ${p.rating} from ₦${p.price.toLocaleString("en-NG")} per night.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PropertyPage,
});

function PropertyPage() {
  const { property } = Route.useLoaderData();
  const { currency, favorites, toggleFavorite } = useSpaces();
  const [selected, setSelected] = useState<Room | null>(null);
  const [slide, setSlide] = useState(0);
  const saved = favorites.includes(property.id);
  const cheapest = property.rooms.reduce((a, b) => (a.rate < b.rate ? a : b));
  const shots = property.images.slice(0, 7);
  const go = (dir: number) => setSlide((s) => (s + dir + shots.length) % shots.length);

  return (
    <div className="pb-28 lg:pb-10">
      <div className="relative">
        <div className="relative h-72 overflow-hidden sm:h-[26rem] lg:rounded-b-3xl">
          {shots.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${property.title} photo ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              width={1600}
              height={900}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-500",
                i === slide ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          {shots.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => go(-1)}
                className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => go(1)}
                className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
              >
                <ChevronRight className="size-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {shots.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to photo ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === slide ? "w-6 bg-card" : "w-1.5 bg-card/60",
                    )}
                  />
                ))}
              </div>
              <div className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-brand-foreground">
                {slide + 1} / {shots.length}
              </div>
            </>
          )}
        </div>


        <Link
          to="/search"
          aria-label="Back to search"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-card/90 backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <button
          type="button"
          aria-label="Save"
          onClick={() => toggleFavorite(property.id)}
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-card/90 backdrop-blur"
        >
          <Heart className={cn("size-5", saved && "fill-destructive text-destructive")} />
        </button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="absolute bottom-4 right-4 h-9 rounded-full">
              <Images className="size-4" /> View all photos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>{property.title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {property.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${property.title} gallery ${i + 1}`}
                  loading="lazy"
                  width={1200}
                  height={800}
                  className="w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 pt-6 md:px-10 lg:flex lg:gap-10">
        <div className="min-w-0 flex-1 space-y-8">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {property.type}
              </Badge>
              <span className="flex items-center gap-1 text-sm font-semibold">
                <Star className="size-4 fill-gold text-gold" /> {property.rating}
                <span className="font-normal text-muted-foreground">({property.reviews} reviews)</span>
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight">{property.title}</h1>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {property.address}
            </p>
            
            <div className="flex flex-wrap gap-2.5 pt-1">
              {property.beds > 0 && (
                <span className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium">
                  <BedDouble className="size-4 text-muted-foreground" /> {property.beds} beds
                </span>
              )}
              <span className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium">
                <Bath className="size-4 text-muted-foreground" /> {property.baths} baths
              </span>
              <span className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" /> up to {property.capacity} guests
              </span>
            </div>

            <div className="card-elevated flex items-center justify-between gap-4 rounded-2xl p-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {property.host.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Managed by</p>
                  <p className="truncate font-display text-base font-bold">{property.host}</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">
                <ShieldCheck className="size-4" /> Verified
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{property.description}</p>

          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Facilities</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {property.facilities.map((f) => (
                <div key={f.group} className="card-elevated p-4">
                  <p className="mb-2 text-sm font-semibold">{f.group}</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {f.items.map((i) => (
                      <li key={i}>· {i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Available rooms</h2>
            <div className="space-y-4">
              {property.rooms.map((room) => (
                <div key={room.id} className="card-elevated grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0 space-y-2">
                    <p className="font-display font-semibold">{room.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {room.occupancy} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="size-3.5" /> {room.bed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="size-3.5" /> {room.size} m²
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((a) => (
                        <span key={a} className="rounded-full bg-secondary px-2.5 py-1 text-[11px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-right">
                      <span className="font-display text-lg font-bold">{formatMoney(room.rate, currency)}</span>
                      <span className="block text-xs text-muted-foreground">per night</span>
                    </p>
                    <Button className="rounded-xl" onClick={() => setSelected(room)}>
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="card-elevated sticky top-6 space-y-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-display text-2xl font-bold">{formatMoney(cheapest.rate, currency)}</p>
              <p className="text-xs text-muted-foreground">per night · taxes calculated at checkout</p>
            </div>
            <Button className="h-12 w-full rounded-xl text-base" onClick={() => setSelected(cheapest)}>
              Book now
            </Button>
            <p className="text-center text-xs text-muted-foreground">Free cancellation up to 48 hours before</p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 px-5 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold">{formatMoney(cheapest.rate, currency)}</p>
            <p className="text-xs text-muted-foreground">per night</p>
          </div>
          <Button className="h-12 shrink-0 rounded-xl px-8" onClick={() => setSelected(cheapest)}>
            Book now
          </Button>
        </div>
      </div>

      {selected && (
        <BookingDialog
          property={property}
          room={selected}
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
        />
      )}
    </div>
  );
}
