import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CalendarDays, Clock3, Loader2, Ticket, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";
import { cancelBookingReservation } from "@/lib/api";
import { formatMoney, nightsBetween, useSpaceaeon, type Booking } from "@/lib/spaces-store";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Your bookings — Spaceaeon" },
      {
        name: "description",
        content: "Track active, pending and past reservations with your Spaceaeon booking passes.",
      },
      { property: "og:title", content: "Your bookings — Spaceaeon" },
      {
        property: "og:description",
        content: "Active, pending and completed guest stays in one place.",
      },
    ],
  }),
  component: BookingsPage,
});

function canCancelBooking(booking: Booking) {
  return booking.status === "active";
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function BookingsPage() {
  const { bookings, hydrated, currency, updateBookingStatus } = useSpaceaeon();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("active");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  if (authLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div className="min-h-[50vh]">
        <SignInRequiredModal isOpen onClose={() => navigate({ to: "/" })} />
      </div>
    );
  }

  const buckets: { active: Booking[]; pending: Booking[]; past: Booking[] } = {
    active: bookings.filter((booking) => booking.status === "active"),
    pending: bookings.filter((booking) => booking.status === "pending"),
    past: bookings.filter((booking) => booking.status === "past" || booking.status === "cancelled"),
  };

  const handleCancel = async () => {
    if (!cancelTarget || cancelling) return;
    const bookingId = cancelTarget.backendId || cancelTarget.ref;
    setCancelling(true);
    try {
      await cancelBookingReservation(bookingId);
      updateBookingStatus(cancelTarget.ref, "cancelled");
      toast.success("Booking cancelled.");
      setSelectedBooking(null);
      setCancelTarget(null);
    } catch (error) {
      console.error("Booking cancellation failed:", error);
      toast.error("Could not cancel this booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pt-6 md:px-10">
      <h1 className="font-display text-2xl font-bold">Your bookings</h1>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-3 rounded-full">
          <TabsTrigger value="active" className="rounded-full">
            Active {buckets.active.length ? `(${buckets.active.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full">
            Pending {buckets.pending.length ? `(${buckets.pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-full">
            Past
          </TabsTrigger>
        </TabsList>

        {(["active", "pending", "past"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-5 space-y-4">
            {!hydrated ? (
              <div className="h-32 animate-pulse rounded-3xl bg-muted" />
            ) : buckets[key].length === 0 ? (
              <EmptyState label={key} />
            ) : (
              buckets[key].map((booking) => (
                <BookingCard
                  key={booking.ref}
                  booking={booking}
                  onSelect={() => setSelectedBooking(booking)}
                  onCancel={() => setCancelTarget(booking)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={selectedBooking !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
      >
        {selectedBooking && (
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
            <DialogHeader className="pr-7 text-left">
              <DialogTitle className="font-display text-xl">Booking ticket</DialogTitle>
              <DialogDescription>
                Reservation details for {selectedBooking.propertyTitle}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4">
                {selectedBooking.image && (
                  <img
                    src={selectedBooking.image}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-display font-semibold">
                    {selectedBooking.propertyTitle}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedBooking.roomName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TicketDetail
                  icon={<CalendarDays className="size-4" />}
                  label="Check-in"
                  value={formatBookingDate(selectedBooking.checkIn)}
                />
                <TicketDetail
                  icon={<CalendarDays className="size-4" />}
                  label="Check-out"
                  value={formatBookingDate(selectedBooking.checkOut)}
                />
                <TicketDetail
                  icon={<Clock3 className="size-4" />}
                  label="Duration"
                  value={`${nightsBetween(selectedBooking.checkIn, selectedBooking.checkOut)} night${nightsBetween(selectedBooking.checkIn, selectedBooking.checkOut) === 1 ? "" : "s"}`}
                />
                <TicketDetail
                  icon={<Users className="size-4" />}
                  label="Guests"
                  value={`${selectedBooking.guests} guest${selectedBooking.guests === 1 ? "" : "s"}`}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ticket className="size-4" /> Reference code
                </span>
                <span className="font-mono text-sm font-semibold">{selectedBooking.ref}</span>
              </div>

              <section className="space-y-3 rounded-2xl border border-border p-4">
                <h3 className="font-display font-semibold">Financial breakdown</h3>
                {selectedBooking.subtotal !== undefined &&
                selectedBooking.serviceFee !== undefined &&
                selectedBooking.cautionFee !== undefined ? (
                  <>
                    <MoneyRow
                      label="Accommodation"
                      amount={selectedBooking.subtotal}
                      currency={currency}
                    />
                    <MoneyRow
                      label="Service fee"
                      amount={selectedBooking.serviceFee}
                      currency={currency}
                    />
                    <MoneyRow
                      label="Caution fee"
                      amount={selectedBooking.cautionFee}
                      currency={currency}
                    />
                    <div className="border-t border-border pt-3">
                      <MoneyRow
                        label="Total"
                        amount={selectedBooking.total}
                        currency={currency}
                        strong
                      />
                    </div>
                  </>
                ) : (
                  <MoneyRow
                    label="Total"
                    amount={selectedBooking.total}
                    currency={currency}
                    strong
                  />
                )}
              </section>

              {canCancelBooking(selectedBooking) && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full rounded-xl"
                  onClick={() => setCancelTarget(selectedBooking)}
                >
                  <XCircle className="size-4" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open && !cancelling) setCancelTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
            >
              {cancelling && <Loader2 className="size-4 animate-spin" />}
              Confirm cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookingCard({
  booking,
  onSelect,
  onCancel,
}: {
  booking: Booking;
  onSelect: () => void;
  onCancel: () => void;
}) {
  const { currency } = useSpaceaeon();
  return (
    <article className="card-elevated overflow-hidden rounded-3xl">
      <button
        type="button"
        onClick={onSelect}
        className="grid w-full grid-cols-[88px_minmax(0,1fr)] gap-4 p-4 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View booking ${booking.ref} for ${booking.propertyTitle}`}
      >
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
            <Badge variant="secondary" className="shrink-0 rounded-full text-[11px] capitalize">
              {booking.status === "pending"
                ? "Pending payment"
                : booking.status === "cancelled"
                  ? "Cancelled"
                  : booking.status}
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
            <span className="font-display font-semibold">
              {formatMoney(booking.total, currency)}
            </span>
          </div>
        </div>
      </button>
      {canCancelBooking(booking) && (
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="rounded-xl"
            onClick={onCancel}
          >
            <XCircle className="size-4" />
            Cancel Booking
          </Button>
        </div>
      )}
    </article>
  );
}

function TicketDetail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function MoneyRow({
  label,
  amount,
  currency,
  strong = false,
}: {
  label: string;
  amount: number;
  currency: "NGN" | "USD";
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{formatMoney(amount, currency)}</span>
    </div>
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
        <Link to="/search">Explore Spaceaeon</Link>
      </Button>
    </div>
  );
}
