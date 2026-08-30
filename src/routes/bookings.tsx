import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Users, Ticket } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, useSpaces, type Booking } from "@/lib/spaces-store";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Your bookings — Spaces" },
      { name: "description", content: "Track active, pending and past reservations with your Spaces booking passes." },
      { property: "og:title", content: "Your bookings — Spaces" },
      { property: "og:description", content: "Active, pending and completed guest stays in one place." },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const { bookings, hydrated } = useSpaces();
  const [tab, setTab] = useState("active");

  const buckets: Record<string, Booking[]> = {
    active: bookings.filter((b) => b.status === "active"),
    pending: bookings.filter((b) => b.status === "pending"),
    past: bookings.filter((b) => b.status === "past"),
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pt-6 md:px-10">
      <h1 className="font-display text-2xl font-bold">Your bookings</h1>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-3 rounded-full">
          <TabsTrigger value="active" className="rounded-full">
            Active {buckets["active"]?.length ? `(${buckets["active"].length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full">
            Pending {buckets["pending"]?.length ? `(${buckets["pending"].length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-full">
            Past
          </TabsTrigger>
        </TabsList>

        {(["active", "pending", "past"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-5 space-y-4">
            {!hydrated ? (
              <div className="h-32 animate-pulse rounded-3xl bg-muted" />
            ) : (buckets[key] ?? []).length === 0 ? (
              <EmptyState label={key} />
            ) : (
              (buckets[key] ?? []).map((b) => <BookingCard key={b.ref} booking={b} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const { currency } = useSpaces();
  return (
    <article className="card-elevated grid grid-cols-[88px_minmax(0,1fr)] gap-4 p-4">
      <img
        src={booking.image}
        alt={booking.propertyTitle}
        loading="lazy"
        width={1200}
        height={800}
        className="size-22 h-full w-22 rounded-2xl object-cover"
      />
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate font-display font-semibold">{booking.propertyTitle}</p>
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full text-[11px] capitalize"
          >
            {booking.status === "pending" ? "Pending payment" : booking.status}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{booking.roomName}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" /> {booking.checkIn} → {booking.checkOut}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" /> {booking.guests} guest{booking.guests > 1 ? "s" : ""}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Ticket className="size-3.5" /> {booking.ref}
          </span>
          <span className="font-display font-semibold">{formatMoney(booking.total, currency)}</span>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="card-elevated flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
        <Ticket className="size-6" />
      </span>
      <p className="font-display text-lg font-semibold">No {label} bookings</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        When you reserve a stay it appears here with your booking pass and reference code.
      </p>
      <Button asChild className="rounded-xl">
        <Link to="/search">Explore spaces</Link>
      </Button>
    </div>
  );
}
