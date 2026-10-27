import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Property, Room } from "@/lib/data";
import { formatMoney, makeRef, nightsBetween, useSpaceaeon } from "@/lib/spaces-store";
import { toast } from "sonner";
import api from "@/lib/api";

const formatISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const today = () => formatISODate(new Date());

const addDays = (value: string, days: number) => {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
};

const inDays = (days: number) => addDays(today(), days);

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    parseISODate(value),
  );

type Step = "dates" | "summary" | "done";

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
  const { currency, addBooking, user } = useSpaceaeon();
  const [step, setStep] = useState<Step>("dates");
  const [checkIn, setCheckIn] = useState(inDays(2));
  const [checkOut, setCheckOut] = useState(inDays(4));
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const subtotal = room.rate * nights;
  const serviceFee = Math.round(subtotal * 0.05);
  const caution = 15000;
  const total = subtotal + serviceFee + caution;
  const minimumCheckOut = addDays(checkIn, 1);

  const reset = () => {
    setStep("dates");
    setLoading(false);
    setReference("");
  };

  const updateCheckIn = (date: string) => {
    const nextCheckIn = date < today() ? today() : date;
    setCheckIn(nextCheckIn);
    if (checkOut <= nextCheckIn) setCheckOut(addDays(nextCheckIn, 1));
  };

  const updateCheckOut = (date: string) => {
    setCheckOut(date < minimumCheckOut ? minimumCheckOut : date);
  };

  const pay = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const fallbackReference = makeRef();
      const res = await api.post("/api/v1/bookings", {
        space_id: property.id,
        room_id: room.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
        total_amount: total,
        payment_method: "bank_transfer",
      });

      const responseData = res.data?.data || res.data;
      const bookingRef = String(responseData?.reference || responseData?.id || fallbackReference);

      addBooking({
        ref: bookingRef,
        propertyId: property.id,
        propertyTitle: property.title,
        image: property.images[0] ?? "",
        roomName: room.name,
        checkIn,
        checkOut,
        guests,
        total,
        status: "pending",
        method: "Bank transfer",
      });

      setReference(bookingRef);
      setStep("done");
    } catch (error) {
      console.error("Booking creation failed:", error);
      toast.error("Could not submit your booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setTimeout(reset, 250);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl">
            {step === "done" ? "Booking confirmed" : property.title}
          </DialogTitle>
          {step !== "done" && <p className="text-sm text-muted-foreground">{room.name}</p>}
        </DialogHeader>

        {step !== "done" && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              className="-ml-2"
              disabled={loading}
              onClick={() => (step === "dates" ? onOpenChange(false) : setStep("dates"))}
            >
              <ArrowLeft className="size-4" />
              {step === "dates" ? "Back to property" : "Back to dates"}
            </Button>
            <p className="text-xs font-medium text-muted-foreground">
              Step {step === "dates" ? "1" : "2"} of 2
            </p>
          </div>
        )}

        {step === "dates" && (
          <div className="space-y-5">
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <DateStepper
                label="Check-in"
                value={checkIn}
                minDate={today()}
                onChange={updateCheckIn}
              />
              <div className="border-t border-border" />
              <DateStepper
                label="Check-out"
                value={checkOut}
                minDate={minimumCheckOut}
                onChange={updateCheckOut}
              />
            </section>

            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <p className="font-medium">Guests</p>
                <p className="text-sm text-muted-foreground">Max {room.occupancy}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-10 rounded-full"
                  aria-label="Remove one guest"
                  disabled={guests <= 1}
                  onClick={() => setGuests((current) => Math.max(1, current - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-6 text-center text-lg font-semibold">{guests}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-10 rounded-full"
                  aria-label="Add one guest"
                  disabled={guests >= room.occupancy}
                  onClick={() => setGuests((current) => Math.min(room.occupancy, current + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <p className="rounded-xl bg-secondary px-4 py-3 text-center text-sm">
              <strong className="font-bold">
                {nights} night{nights === 1 ? "" : "s"}
              </strong>
            </p>
            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              onClick={() => setStep("summary")}
            >
              Continue · {formatMoney(total, currency)}
            </Button>
          </div>
        )}

        {step === "summary" && (
          <div className="space-y-5">
            <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div>
                <h2 className="font-display text-lg font-bold">Your stay</h2>
                <p className="text-sm text-muted-foreground">
                  {property.title} · {room.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SummaryItem label="Check-in" value={formatDateLabel(checkIn)} />
                <SummaryItem label="Check-out" value={formatDateLabel(checkOut)} />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Nights · Guests</span>
                <span className="font-semibold">
                  {nights} · {guests}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Booked by</span>
                <span className="font-semibold">{user.firstName}</span>
              </div>
            </section>

            <section className="space-y-2 text-sm">
              <Row
                label={`${formatMoney(room.rate, currency)} × ${nights} nights`}
                value={formatMoney(subtotal, currency)}
              />
              <Row label="Service fee (5%)" value={formatMoney(serviceFee, currency)} />
              <Row label="Refundable caution" value={formatMoney(caution, currency)} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
            </section>

            <Button
              type="button"
              className="h-12 w-full rounded-xl text-base"
              onClick={pay}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                `Pay Now · ${formatMoney(total, currency)}`
              )}
            </Button>
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Booking reference
              </p>
              <p className="font-display text-2xl font-bold tracking-wider">{reference}</p>
            </div>
            <div className="space-y-2 text-left text-sm">
              <Row label="Dates" value={`${checkIn} → ${checkOut}`} />
              <Row label="Nights" value={String(nights)} />
              <Row label="Guests" value={String(guests)} />
              <Row label="Payment method" value="Bank transfer" />
              <Row label="Total" value={formatMoney(total, currency)} />
            </div>
            <Badge variant="secondary" className="rounded-full">
              Pending confirmation
            </Badge>
            <Button
              type="button"
              className="h-12 w-full rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DateStepper({
  label,
  value,
  minDate,
  onChange,
}: {
  label: string;
  value: string;
  minDate: string;
  onChange: (date: string) => void;
}) {
  const date = parseISODate(value);
  const minimumDate = parseISODate(minDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const [monthInput, setMonthInput] = useState(String(month).padStart(2, "0"));
  const [yearInput, setYearInput] = useState(String(year));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(
    new Date(date.getFullYear(), date.getMonth(), 1),
  );

  useEffect(() => {
    setMonthInput(String(month).padStart(2, "0"));
    setYearInput(String(year));
    setDisplayMonth(new Date(year, month - 1, 1));
  }, [month, year]);

  const normalizeDate = (nextMonth: number, nextYear: number) => {
    const lastDay = new Date(nextYear, nextMonth, 0).getDate();
    const nextDate = formatISODate(
      new Date(nextYear, nextMonth - 1, Math.min(date.getDate(), lastDay)),
    );
    onChange(nextDate < minDate ? minDate : nextDate);
  };

  const commitMonth = () => {
    const parsedMonth = Number(monthInput);
    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      setMonthInput(String(month).padStart(2, "0"));
      return;
    }
    normalizeDate(parsedMonth, year);
  };

  const commitYear = () => {
    const parsedYear = Number(yearInput);
    const minYear = minimumDate.getFullYear();
    const maxYear = new Date().getFullYear() + 10;
    if (!Number.isInteger(parsedYear) || parsedYear < minYear || parsedYear > maxYear) {
      setYearInput(String(year));
      return;
    }
    normalizeDate(month, parsedYear);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-display text-lg font-semibold">
            {formatDateLabel(value)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-9 rounded-lg"
                aria-label={`Choose ${label.toLowerCase()} date from calendar`}
              >
                <CalendarDays className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-auto rounded-2xl border-border p-2 shadow-xl"
            >
              <div className="px-3 pt-2">
                <p className="text-sm font-semibold">Choose {label.toLowerCase()}</p>
                <p className="text-xs text-muted-foreground">
                  Select a date on or after {formatDateLabel(minDate)}.
                </p>
              </div>
              <Calendar
                mode="single"
                selected={date}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                onSelect={(nextDate) => {
                  if (nextDate) {
                    onChange(formatISODate(nextDate < minimumDate ? minimumDate : nextDate));
                    setCalendarOpen(false);
                  }
                }}
                disabled={{ before: minimumDate }}
                startMonth={minimumDate}
                endMonth={new Date(new Date().getFullYear() + 10, 11, 1)}
                className="p-2 [--cell-size:2.5rem]"
              />
            </PopoverContent>
          </Popover>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 rounded-lg"
              aria-label={`Advance ${label.toLowerCase()} by one day`}
              onClick={() => onChange(addDays(value, 1))}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 rounded-lg"
              aria-label={`Move ${label.toLowerCase()} back by one day`}
              disabled={value <= minDate}
              onClick={() => onChange(addDays(value, -1))}
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">Month (1–12)</span>
          <Input
            type="text"
            inputMode="numeric"
            aria-label={`${label} month`}
            value={monthInput}
            maxLength={2}
            onChange={(event) => {
              if (/^\d{0,2}$/.test(event.target.value)) setMonthInput(event.target.value);
            }}
            onBlur={commitMonth}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-9 rounded-lg"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">Year</span>
          <Input
            type="text"
            inputMode="numeric"
            aria-label={`${label} year`}
            value={yearInput}
            maxLength={4}
            onChange={(event) => {
              if (/^\d{0,4}$/.test(event.target.value)) setYearInput(event.target.value);
            }}
            onBlur={commitYear}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-9 rounded-lg"
          />
        </label>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
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
