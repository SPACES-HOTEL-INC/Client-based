import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Star, Users } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/data";
import { formatMoney, useSpaces } from "@/lib/spaces-store";
import { cn } from "@/lib/utils";

export function PropertyCard({ property }: { property: Property | any }) {
  const { currency, favorites, toggleFavorite } = useSpaces();
  const [index, setIndex] = useState(0);

  // Support both `Property` shape and raw `room` payloads (room mapped to property-like object)
  const isRoom = property && property.price_per_night != null;
  const id = String(property?.id ?? property?.property_id ?? "");
  const images: string[] = Array.isArray(property?.images) ? property.images : property?.images ? [property.images] : [];
  const title = property?.title ?? "";
  const hotelName = property?.hotel_name ?? property?.host ?? "";
  const city = property?.city ?? "";
  const state = property?.state ?? "";
  const price = isRoom ? Number(property.price_per_night ?? property.price ?? 0) : Number(property?.price ?? 0);
  const rating = Number(property?.avg_rating ?? property?.rating ?? 0) || 0;
  const capacity = property?.capacity ?? 1;

  const saved = favorites.includes(id);

  return (
    <article className="card-elevated group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={images?.[index] ?? ""}
          alt={title ?? ""}
          loading="lazy"
          width={1200}
          height={800}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold">
          <Star className="size-3.5 fill-gold text-gold" />
          {rating}
        </div>
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save property"}
          onClick={() => toggleFavorite(id)}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 transition-transform active:scale-90"
        >
          <Heart className={cn("size-4.5", saved ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        <div className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-brand-foreground">
          {formatMoney(price ?? 0, currency)}
          <span className="font-normal opacity-70">/night</span>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {(images ?? []).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-card" : "w-1.5 bg-card/60",
              )}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <Link
          to="/property/$id"
          params={{ id }}
          className="line-clamp-1 font-display text-base font-semibold hover:text-primary"
        >
          {title}
        </Link>
        {hotelName ? (
          <p className="text-sm text-muted-foreground">{hotelName}</p>
        ) : null}
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {city} {city && state ? "·" : ""} {state}
          </span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> Up to {capacity ?? 1}
          </span>
          <Link
            to="/property/$id"
            params={{ id }}
            className="text-xs font-semibold text-primary"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
