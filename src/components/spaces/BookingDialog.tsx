import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
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

type Step = "dates" | "summary";
const ROW_HEIGHT = 40;

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
  const [activeDateField, setActiveDateField] = useState<"checkIn" | "checkOut">("checkIn");
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const subtotal = room.rate * nights;
  const serviceFee = Math.round(subtotal * 0.05);
  const caution = 15000;
  const total = subtotal + serviceFee + caution;
  const minimumCheckOut = addDays(checkIn, 1);

  const reset = () => {
    setStep("dates");
    setActiveDateField("checkIn");
    setLoading(false);
  };

  const updateCheckIn = (date: string) => {
    const nextCheckIn = date < today() ? today() : date;
    setCheckIn(nextCheckIn);
    if (checkOut <= nextCheckIn) setCheckOut(addDays(nextCheckIn, 1));
  };

  const updateCheckOut = (date: string) => {
    setCheckOut(date < minimumCheckOut ? minimumCheckOut : date);
  };

  const updateActiveDate = (date: string) => {
    if (activeDateField === "checkIn") {
      updateCheckIn(date);
    } else {
      updateCheckOut(date);
    }
  };

  const activeDate = activeDateField === "checkIn" ? checkIn : checkOut;
  const activeMinimum = activeDateField === "checkIn" ? today() : minimumCheckOut;
  const activeDateValue = parseISODate(activeDate);
  const activeMinimumValue = parseISODate(activeMinimum);
  const activeDaysInMonth = new Date(
    activeDateValue.getFullYear(),
    activeDateValue.getMonth() + 1,
    0,
  ).getDate();
  const activeMinDay =
    activeDateValue.getFullYear() === activeMinimumValue.getFullYear() &&
    activeDateValue.getMonth() === activeMinimumValue.getMonth()
      ? activeMinimumValue.getDate()
      : 1;

  const updateActiveMonth = (month: Date) => {
    const currentDate = parseISODate(activeDate);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const day = Math.min(currentDate.getDate(), lastDayOfMonth);
    updateActiveDate(formatISODate(new Date(month.getFullYear(), month.getMonth(), day)));
  };

  const pay = async () => {
    if (loading) return;
    setLoading(true);

    try {
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
      const bookingRef = responseData?.reference || responseData?.id || makeRef();

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

      toast.success("Booking request submitted. Payment is pending.");
      onOpenChange(false);
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={activeDateField === "checkIn"}
                onClick={() => setActiveDateField("checkIn")}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  activeDateField === "checkIn"
                    ? "border-primary bg-accent/40"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <span className="block text-xs text-muted-foreground">Check-in</span>
                <span className="mt-1 block text-sm font-semibold">{formatDateLabel(checkIn)}</span>
              </button>
              <button
                type="button"
                aria-pressed={activeDateField === "checkOut"}
                onClick={() => setActiveDateField("checkOut")}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  activeDateField === "checkOut"
                    ? "border-primary bg-accent/40"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <span className="block text-xs text-muted-foreground">Check-out</span>
                <span className="mt-1 block text-sm font-semibold">
                  {formatDateLabel(checkOut)}
                </span>
              </button>
            </div>

            <div className="grid gap-4 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_88px] sm:p-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {activeDateField === "checkIn" ? "Select check-in" : "Select check-out"}
                    </p>
                    <p className="text-xs text-muted-foreground">Choose a date on the calendar</p>
                  </div>
                </div>
                <Calendar
                  mode="single"
                  selected={activeDateValue}
                  month={activeDateValue}
                  onMonthChange={updateActiveMonth}
                  onSelect={(date) => {
                    if (date) updateActiveDate(formatISODate(date));
                  }}
                  disabled={{ before: activeMinimumValue }}
                  modifiers={{
                    stay: {
                      from: parseISODate(checkIn),
                      to: parseISODate(checkOut),
                    },
                  }}
                  modifiersClassNames={{ stay: "bg-accent text-accent-foreground" }}
                  className="mx-auto p-1 [--cell-size:2.25rem]"
                  startMonth={activeMinimumValue}
                  endMonth={new Date(new Date().getFullYear() + 10, 11, 1)}
                />
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/60 px-2 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Day
                </p>
                <DayWheel
                  label={`${activeDateField === "checkIn" ? "Check-in" : "Check-out"} day`}
                  value={activeDateValue.getDate()}
                  daysInMonth={activeDaysInMonth}
                  minDay={activeMinDay}
                  onChange={(day) => {
                    const selected = new Date(activeDateValue);
                    selected.setDate(day);
                    updateActiveDate(formatISODate(selected));
                  }}
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
      </DialogContent>
    </Dialog>
  );
}

function DayWheel({
  label,
  value,
  daysInMonth,
  minDay,
  onChange,
}: {
  label: string;
  value: number;
  daysInMonth: number;
  minDay: number;
  onChange: (day: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const scrollingRef = useRef(false);
  const options = useMemo(
    () => Array.from({ length: daysInMonth - minDay + 1 }, (_, index) => minDay + index),
    [daysInMonth, minDay],
  );
  const selectedIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    if (scrollingRef.current) return;
    if (containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * ROW_HEIGHT;
    }
  }, [selectedIndex, options.length]);

  useEffect(
    () => () => {
      if (scrollTimeoutRef.current !== null) window.clearTimeout(scrollTimeoutRef.current);
    },
    [],
  );

  const selectIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(options.length - 1, index));
    onChange(options[nextIndex]);
    containerRef.current?.scrollTo({
      top: nextIndex * ROW_HEIGHT,
      behavior: "smooth",
    });
  };

  const syncFromScroll = () => {
    scrollingRef.current = true;
    if (scrollTimeoutRef.current !== null) window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      const element = containerRef.current;
      if (!element) return;
      const index = Math.max(
        0,
        Math.min(options.length - 1, Math.round(element.scrollTop / ROW_HEIGHT)),
      );
      scrollingRef.current = false;
      if (options[index] !== value) onChange(options[index]);
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      className="h-[200px] cursor-grab select-none overflow-y-auto overscroll-contain py-20 text-center outline-none active:cursor-grabbing [scrollbar-width:none] snap-y snap-mandatory touch-pan-y [&::-webkit-scrollbar]:hidden"
      onScroll={syncFromScroll}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        dragRef.current = {
          startY: event.clientY,
          startScrollTop: event.currentTarget.scrollTop,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current || event.pointerType !== "mouse") return;
        event.currentTarget.scrollTop =
          dragRef.current.startScrollTop - (event.clientY - dragRef.current.startY);
      }}
      onPointerUp={(event) => {
        if (!dragRef.current || event.pointerType !== "mouse") return;
        dragRef.current = null;
        selectIndex(Math.round(event.currentTarget.scrollTop / ROW_HEIGHT));
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          selectIndex(selectedIndex - 1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          selectIndex(selectedIndex + 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          selectIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          selectIndex(options.length - 1);
        }
      }}
    >
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          role="option"
          aria-selected={option === value}
          tabIndex={-1}
          className={`block h-10 w-full snap-center text-sm transition-colors ${
            option === value ? "font-bold text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => selectIndex(index)}
        >
          {String(option).padStart(2, "0")}
        </button>
      ))}
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
