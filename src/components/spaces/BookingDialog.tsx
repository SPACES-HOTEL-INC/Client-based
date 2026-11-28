import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Loader2, Minus, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Property, Room } from "@/lib/data";
import { formatMoney, nightsBetween, useSpaceaeon, type PaymentDraft } from "@/lib/spaces-store";
import { toast } from "sonner";
import { createBookingReservation } from "@/lib/api";

const formatISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseISODate = (value: string) => new Date(`${value}T00:00:00`);

const today = () => formatISODate(new Date());

const addDays = (value: string, days: number) => {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    parseISODate(value),
  );

const getDateSegments = (value: string) => {
  const date = parseISODate(value);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    year: String(date.getFullYear()),
  };
};

const parseDateInput = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return formatISODate(date);
};

type Step = "dates" | "summary";

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
  const { currency, user } = useSpaceaeon();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("dates");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(() => addDays(today(), 1));
  const [dateInputsValid, setDateInputsValid] = useState({ checkIn: true, checkOut: true });
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultCheckIn = today();
    setCheckIn(defaultCheckIn);
    setCheckOut(addDays(defaultCheckIn, 1));
    setDateInputsValid({ checkIn: true, checkOut: true });
  }, [open]);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const subtotal = room.rate * nights;
  const serviceFee = Math.round(subtotal * 0.05);
  const caution = 15000;
  const total = subtotal + serviceFee + caution;
  const minimumCheckOut = addDays(checkIn, 1);

  const reset = () => {
    setStep("dates");
    setLoading(false);
  };

  const updateCheckIn = (date: string) => {
    const nextCheckIn = date < today() ? today() : date;
    setCheckIn(nextCheckIn);
    if (checkOut <= nextCheckIn) {
      setCheckOut(addDays(nextCheckIn, 1));
      setDateInputsValid((current) =>
        current.checkOut ? current : { ...current, checkOut: true },
      );
    }
  };

  const updateCheckOut = (date: string) => {
    setCheckOut(date < minimumCheckOut ? minimumCheckOut : date);
  };

  const canContinueDates =
    dateInputsValid.checkIn && dateInputsValid.checkOut && checkIn >= today() && checkOut > checkIn;

  const pay = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const booking = await createBookingReservation({
        room_id: room.id,
        property_id: property.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: guests,
        special_requests: "",
        total_price: total,
      });
      if (!booking.id?.trim()) {
        throw new Error("The reservation could not be created. Please try again.");
      }

      const backendReference = booking.spc_code?.trim() || "";
      const reference = `PAY-${crypto.randomUUID()}`;
      const bookingTotal = Number(booking.total_price);
      const bookingNights = Number(booking.num_nights);
      const draft: PaymentDraft = {
        reference,
        propertyId: property.id,
        propertyTitle: property.title,
        image: property.images[0] ?? "",
        roomId: room.id,
        roomName: room.name,
        checkIn,
        checkOut,
        numNights: Number.isFinite(bookingNights) && bookingNights > 0 ? bookingNights : nights,
        guests,
        total: Number.isFinite(bookingTotal) && bookingTotal >= 0 ? bookingTotal : total,
        subtotal,
        serviceFee,
        cautionFee: caution,
        customerName: user.firstName,
        customerEmail: user.email,
        bookingId: booking.id,
        ...(backendReference ? { receiptCode: backendReference } : {}),
      };
      sessionStorage.setItem(`Spaceaeon.payment.${reference}`, JSON.stringify(draft));
      sessionStorage.setItem("Spaceaeon.payment.active", reference);
      onOpenChange(false);
      await navigate({ to: "/payment", search: { reference } });
    } catch (error) {
      console.error("Could not open the payment page:", error);
      toast.error(error instanceof Error ? error.message : "Could not open the payment page.");
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
          <DialogTitle className="font-display text-xl">{property.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{room.name}</p>
        </DialogHeader>

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

        {step === "dates" && (
          <div className="space-y-5">
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <DateStepper
                label="Check In"
                value={checkIn}
                minDate={today()}
                onChange={updateCheckIn}
                onValidityChange={(isValid) =>
                  setDateInputsValid((current) =>
                    current.checkIn === isValid ? current : { ...current, checkIn: isValid },
                  )
                }
              />
              <div className="border-t border-border" />
              <DateStepper
                label="Check Out"
                value={checkOut}
                minDate={minimumCheckOut}
                onChange={updateCheckOut}
                onValidityChange={(isValid) =>
                  setDateInputsValid((current) =>
                    current.checkOut === isValid ? current : { ...current, checkOut: isValid },
                  )
                }
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
              disabled={!canContinueDates}
              onClick={() => {
                if (canContinueDates) setStep("summary");
              }}
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
      </DialogContent>
    </Dialog>
  );
}

function DateStepper({
  label,
  value,
  minDate,
  onChange,
  onValidityChange,
}: {
  label: string;
  value: string;
  minDate: string;
  onChange: (date: string) => void;
  onValidityChange: (isValid: boolean) => void;
}) {
  const date = parseISODate(value);
  const minimumDate = parseISODate(minDate);
  const [dateSegments, setDateSegments] = useState(() => getDateSegments(value));
  const [dateInputValid, setDateInputValid] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(
    new Date(date.getFullYear(), date.getMonth(), 1),
  );

  useEffect(() => {
    setDateSegments(getDateSegments(value));
    setDateInputValid(true);
    const selectedDate = parseISODate(value);
    setDisplayMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  const updateDateSegment = (segment: keyof typeof dateSegments, inputValue: string) => {
    const maxLength = segment === "year" ? 4 : 2;
    const nextSegments = {
      ...dateSegments,
      [segment]: inputValue.replace(/\D/g, "").slice(0, maxLength),
    };
    const nextDate = parseDateInput(
      `${nextSegments.day}/${nextSegments.month}/${nextSegments.year}`,
    );
    const isValid = nextDate !== null && nextDate >= minDate;

    setDateSegments(nextSegments);
    setDateInputValid(isValid);
    onValidityChange(isValid);
    if (isValid && nextDate) onChange(nextDate);
  };

  const endMonth = new Date(
    Math.max(new Date().getFullYear() + 10, minimumDate.getFullYear()),
    11,
    1,
  );
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <span id={`${inputId}-label`} className="block text-sm font-medium">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-labelledby={`${inputId}-label`}
          aria-invalid={!dateInputValid}
          aria-describedby={!dateInputValid ? `${inputId}-error` : undefined}
          className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-input bg-background px-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        >
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            placeholder="dd"
            value={dateSegments.day}
            aria-label={`${label} day`}
            aria-invalid={!dateInputValid}
            aria-describedby={!dateInputValid ? `${inputId}-error` : undefined}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => updateDateSegment("day", event.target.value)}
            className="w-8 bg-transparent text-center outline-none placeholder:text-muted-foreground"
          />
          <span aria-hidden="true">/</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            placeholder="mm"
            value={dateSegments.month}
            aria-label={`${label} month`}
            aria-invalid={!dateInputValid}
            aria-describedby={!dateInputValid ? `${inputId}-error` : undefined}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => updateDateSegment("month", event.target.value)}
            className="w-8 bg-transparent text-center outline-none placeholder:text-muted-foreground"
          />
          <span aria-hidden="true">/</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="yyyy"
            value={dateSegments.year}
            aria-label={`${label} year`}
            aria-invalid={!dateInputValid}
            aria-describedby={!dateInputValid ? `${inputId}-error` : undefined}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => updateDateSegment("year", event.target.value)}
            className="w-14 bg-transparent text-center outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-11 shrink-0 rounded-lg"
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
                if (nextDate && nextDate >= minimumDate) {
                  const nextValue = formatISODate(nextDate);
                  onChange(nextValue);
                  onValidityChange(true);
                  setDateInputValid(true);
                  setCalendarOpen(false);
                }
              }}
              disabled={{ before: minimumDate }}
              startMonth={new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1)}
              endMonth={endMonth}
              captionLayout="dropdown"
              weekStartsOn={1}
              formatters={{
                formatWeekdayName: (weekday) =>
                  new Intl.DateTimeFormat("en", { weekday: "short" }).format(weekday).slice(0, 2),
              }}
              className="p-2 [--cell-size:2.5rem]"
            />
          </PopoverContent>
        </Popover>
      </div>
      {!dateInputValid && (
        <p id={`${inputId}-error`} className="text-xs text-destructive" role="alert">
          Enter a valid date in dd/mm/yyyy format on or after {formatDateLabel(minDate)}.
        </p>
      )}
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
