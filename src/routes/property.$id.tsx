import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Loader2,
  Send,
} from "lucide-react";
import { fetchProperty, fetchPropertyReviews, submitPropertyReview } from "@/lib/api";
import type { Property, Room } from "@/lib/data";
import { formatMoney, useSpaces } from "@/lib/spaces-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookingDialog } from "@/components/spaces/BookingDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";

export const Route = createFileRoute("/property/$id")({
  loader: async ({ params }) => {
    try {
      const propertyData = await fetchProperty(params.id);

      if (!propertyData || !propertyData.id) {
        throw notFound();
      }

      // Ensure property_type takes precedence over generic type
      const resolvedType = propertyData.property_type || propertyData.type || "Apartment";

      const property: Property = {
        ...propertyData,
        title: propertyData.title || propertyData.name || propertyData.hotel_name || "Luxury Space",
        type: resolvedType,
        city: propertyData.city || "Lagos",
        state: propertyData.state || "Lagos State",
        address: propertyData.address || `${propertyData.city || "Lagos"}, Nigeria`,
        rating: propertyData.rating || propertyData.avg_rating || 4.8,
        reviews: propertyData.reviews || propertyData.review_count || 12,
        price: propertyData.price || propertyData.price_per_night || 50000,
        beds: propertyData.beds || propertyData.bedrooms || 1,
        baths: propertyData.baths || propertyData.bathrooms || 1,
        capacity: propertyData.capacity || propertyData.max_guests || 2,
        host: propertyData.host || propertyData.host_name || "Spaces Host",
        description: propertyData.description || "Experience top-tier hospitality and refined comfort in this premium space.",
        images: Array.isArray(propertyData.images) && propertyData.images.length > 0
          ? propertyData.images
          : [propertyData.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200"],
        facilities: Array.isArray(propertyData.facilities) ? propertyData.facilities : [],
        rooms: Array.isArray(propertyData.rooms) && propertyData.rooms.length > 0
          ? propertyData.rooms
          : [
              {
                id: propertyData.id,
                name: "Standard Booking Unit",
                occupancy: propertyData.capacity || propertyData.max_guests || 2,
                bed: "King Bed",
                size: 35,
                rate: propertyData.price || propertyData.price_per_night || 50000,
                amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities : ["Wi-Fi", "Air Conditioning", "En-suite"],
              },
            ],
      };

      return { property };
    } catch (e) {
      throw notFound();
    }
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

function ReviewsSection({ propertyId, rating, count }: { propertyId: string; rating: number; count: number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const data = await fetchPropertyReviews(propertyId);
      setReviews(data);
      setLoading(false);
    }
    if (propertyId) loadReviews();
  }, [propertyId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter a review comment");
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitPropertyReview({
        property_id: propertyId,
        rating: newRating,
        comment: comment.trim(),
      });
      toast.success("Review submitted successfully!");
      setReviews((prev) => [created, ...prev]);
      setComment("");
      setNewRating(5);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Guest Reviews</h2>
        <span className="flex items-center gap-1 text-sm font-semibold">
          <Star className="size-4 fill-gold text-gold" /> {rating}
          <span className="font-normal text-muted-foreground">({reviews.length || count} total)</span>
        </span>
      </div>

      <form onSubmit={handleSubmitReview} className="card-elevated p-4 rounded-2xl space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave a Review</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setNewRating(num)}
                className="p-1 focus:outline-none"
              >
                <Star
                  className={`size-4 ${
                    num <= newRating ? "fill-gold text-gold" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your stay experience..."
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" disabled={submitting} className="h-9 rounded-xl px-4 text-xs gap-1.5">
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Post
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reviews posted yet for this space.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reviews.map((rev: any, index: number) => (
            <div key={rev.id || index} className="card-elevated p-4 space-y-2 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs">{rev.user_name || "Verified Guest"}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i < (rev.rating || 5) ? "fill-gold text-gold" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PropertyPage() {
  const { property } = Route.useLoaderData();
  const { currency, favorites, toggleFavorite } = useSpaces();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Room | null>(null);
  const [slide, setSlide] = useState(0);
  const saved = favorites.includes(property.id);

  if (authLoading) {
    return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  if (!user?.email) {
    return (
      <div className="min-h-[50vh]">
        <SignInRequiredModal isOpen onClose={() => navigate({ to: "/search" })} />
      </div>
    );
  }

  const cheapest = property.rooms.length > 0 
    ? property.rooms.reduce((a, b) => (a.rate < b.rate ? a : b))
    : {
        id: property.id,
        name: "Standard Booking Unit",
        occupancy: property.capacity,
        bed: "King Bed",
        size: 35,
        rate: property.price,
        amenities: [],
      };

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
              {/* Dynamic Property Type Badge */}
              <Badge variant="secondary" className="rounded-full capitalize font-semibold px-3 py-1">
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

          {property.facilities.length > 0 && (
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
          )}

          <ReviewsSection propertyId={property.id} rating={property.rating} count={property.reviews} />

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Available rooms & options</h2>
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