import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy, CreditCard, Landmark, Loader2, Minus, Plus } from "lucide-react";
import type { Property, Room } from "@/lib/data";
import { formatMoney, makeRef, nightsBetween, useSpaces } from "@/lib/spaces-store";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

type Step = "dates" | "summary" | "payment" | "processing" | "done";

export function BookingDialog({
  property,
  room,
  open,
  onOpenChange,
}: {
  property: Property;
  room: Room;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currency, addBooking, user } = useSpaces();
  const [step, setStep] = useState<Step>("dates");
  const [checkIn, setCheckIn] = useState(inDays(2));
  const [checkOut, setCheckOut] = useState(inDays(4));
  const [guests, setGuests] = useState(2);
  const [method, setMethod] = useState<"transfer" | "card">("transfer");
  const [reference, setReference] = useState("");

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const subtotal = room.rate * nights;
  const serviceFee = Math.round(subtotal * 0.05);
  const caution = 15000;
  const total = subtotal + serviceFee + caution;

  const reset = () => {
    setStep("dates");
    setReference("");
  };

  const pay = () => {
    setStep("processing");
    setTimeout(() => {
      const ref = makeRef();
      setReference(ref);
      addBooking({
        ref,
        propertyId: property.id,
        propertyTitle: property.title,
        image: property.images[0] ?? "",
        roomName: room.name,
        checkIn,
        checkOut,
        guests,
        total,
        status: method === "transfer" ? "pending" : "active",
        method: method === "transfer" ? "Wema Bank transfer" : "Card payment",
      });
      setStep("done");
    }, 1800);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 250);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl">
            {step === "done" ? "Booking confirmed" : step === "payment" ? "Payment" : property.title}
          </DialogTitle>
          {step !== "done" && <p className="text-sm text-muted-foreground">{room.name}</p>}
        </DialogHeader>

        {step === "dates" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ci">Check-in</Label>
                <Input
                  id="ci"
                  type="date"
                  min={today()}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co">Check-out</Label>
                <Input
                  id="co"
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <p className="font-medium">Guests</p>
                <p className="text-sm text-muted-foreground">Max {room.occupancy}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-10 rounded-full"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-6 text-center text-lg font-semibold">{guests}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-10 rounded-full"
                  onClick={() => setGuests((g) => Math.min(room.occupancy, g + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            <Button className="h-12 w-full rounded-xl text-base" onClick={() => setStep("summary")}>
              Continue · {formatMoney(total, currency)}
            </Button>
          </div>
        )}

        {step === "summary" && (
          <div className="space-y-5">
            <div className="space-y-2 rounded-2xl bg-secondary p-4 text-sm">
              <Row label="Dates" value={`${checkIn} → ${checkOut}`} />
              <Row label="Nights" value={String(nights)} />
              <Row label="Guests" value={String(guests)} />
              <Row label="Booked by" value={user.firstName} />
            </div>
            <div className="space-y-2 text-sm">
              <Row label={`${formatMoney(room.rate, currency)} × ${nights} nights`} value={formatMoney(subtotal, currency)} />
              <Row label="Service fee (5%)" value={formatMoney(serviceFee, currency)} />
              <Row label="Refundable caution" value={formatMoney(caution, currency)} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setStep("dates")}>
                Back
              </Button>
              <Button className="h-12 flex-1 rounded-xl" onClick={() => setStep("payment")}>
                Pay now
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-5">
            <div className="grid gap-3">
              <MethodOption
                active={method === "transfer"}
                onClick={() => setMethod("transfer")}
                icon={<Landmark className="size-5" />}
                title="Bank transfer"
                sub="Dedicated Wema Bank account"
              />
              <MethodOption
                active={method === "card"}
                onClick={() => setMethod("card")}
                icon={<CreditCard className="size-5" />}
                title="Debit / Credit card"
                sub="Verve, Visa, Mastercard"
              />
            </div>

            {method === "transfer" ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">Transfer exactly {formatMoney(total, currency)} to:</p>
                <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Wema Bank · SPACES / {user.firstName}</p>
                    <p className="font-display text-lg font-semibold tracking-wider">7643 209 118</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard?.writeText("7643209118");
                      toast.success("Account number copied");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Account expires in 30 minutes. Your booking confirms automatically once payment lands.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input placeholder="Card number" inputMode="numeric" className="h-12 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MM / YY" className="h-12 rounded-xl" />
                  <Input placeholder="CVV" className="h-12 rounded-xl" />
                </div>
              </div>
            )}

            <Button className="h-12 w-full rounded-xl text-base" onClick={pay}>
              {method === "transfer" ? "I have sent the transfer" : `Pay ${formatMoney(total, currency)}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Secured demo checkout · no real charge</p>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirming your payment…</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-5 py-2 text-center">
            <CheckCircle2 className="mx-auto size-14 text-teal" />
            <div>
              <p className="font-display text-lg font-semibold">{property.title}</p>
              <p className="text-sm text-muted-foreground">{room.name}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Booking reference</p>
              <p className="font-display text-2xl font-bold tracking-wider">{reference}</p>
            </div>
            <div className="space-y-2 text-left text-sm">
              <Row label="Dates" value={`${checkIn} → ${checkOut}`} />
              <Row label="Guests" value={String(guests)} />
              <Row label="Paid with" value={method === "transfer" ? "Wema transfer" : "Card"} />
              <Row label="Total" value={formatMoney(total, currency)} />
            </div>
            <Badge variant="secondary" className="rounded-full">
              {method === "transfer" ? "Pending confirmation" : "Confirmed"}
            </Badge>
            <Button className="h-12 w-full rounded-xl" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
        active ? "border-primary bg-accent/40" : "border-border"
      }`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
