import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Star, Users } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/data";
import { formatMoney, useSpaces } from "@/lib/spaces-store";
import { useAuth } from "@/hooks/useAuth";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";
import { cn } from "@/lib/utils";

export function PropertyCard({
  property,
  linkToSearch = false,
  requireSignIn = false,
}: {
  property: Property | any;
  linkToSearch?: boolean;
  requireSignIn?: boolean;
}) {
  const { currency, favorites, toggleFavorite } = useSpaces();
  const { user, loading: authLoading } = useAuth();
  const [index, setIndex] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Support both `Property` shape and raw `room` payloads (room mapped to property-like object)
  const isRoom = property && property.price_per_night != null;
  const id = String(property?.id ?? property?.property_id ?? "");
  const images: string[] = Array.isArray(property?.images) ? property.images : property?.images ? [property.images] : [];
  
  // Title / Name resolution
  const displayTitle = property?.name ?? property?.title ?? property?.hotel_name ?? "";
  const hostOrLocation = property?.host ?? property?.hotel_name ?? "";
  
  // Property Type resolution
  const propertyType = property?.property_type ?? property?.type ?? "Property";

  const city = property?.city ?? "";
  const state = property?.state ?? "";
  const price = isRoom ? Number(property.price_per_night ?? property.price ?? 0) : Number(property?.price ?? 0);
  const rating = Number(property?.avg_rating ?? property?.rating ?? 0) || 0;
  const capacity = property?.capacity ?? 1;

  const saved = favorites.includes(id);
  const propertyLink = linkToSearch
    ? { to: "/search" as const }
    : { to: "/property/$id" as const, params: { id } };
  const handlePropertyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (requireSignIn && !authLoading && (!user || !user.email)) {
      e.preventDefault();
      setAuthModalOpen(true);
    }
  };

  return (
    <>
    <article className="card-elevated group overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Link
            {...propertyLink}
            onClick={handlePropertyClick}
            aria-label={`View details for ${displayTitle}`}
            className="block size-full"
          >
            <img
              src={images?.[index] ?? ""}
              alt={displayTitle ?? ""}
              loading="lazy"
              width={1200}
              height={800}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
          
          {/* Rating Badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold">
            <Star className="size-3.5 fill-gold text-gold" />
            {rating}
          </div>

          {/* Property Type Badge */}
          <div className="absolute left-3 bottom-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm shadow-sm">
            {propertyType}
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save property"}
            onClick={() => toggleFavorite(id)}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 transition-transform active:scale-90"
          >
            <Heart className={cn("size-4.5", saved ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>

          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-brand-foreground">
            {formatMoney(price ?? 0, currency)}
            <span className="font-normal opacity-70">/night</span>
          </div>

          {/* Image Navigation Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
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
            {...propertyLink}
            onClick={handlePropertyClick}
            className="line-clamp-1 font-display text-base font-semibold hover:text-primary"
          >
            {displayTitle}
          </Link>
          
          {hostOrLocation && hostOrLocation !== displayTitle ? (
            <p className="text-sm text-muted-foreground">{hostOrLocation}</p>
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
              {...propertyLink}
              onClick={handlePropertyClick}
              className="text-xs font-semibold text-primary"
            >
              View details
            </Link>
          </div>
        </div>
    </article>
    <SignInRequiredModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
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