import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  cancelBookingReservation,
  createBookingReservation,
  fetchPayment,
  initiatePayment,
  type PaymentInitiationResponse,
  type PaymentMethod,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  makeRef,
  nightsBetween,
  useSpaceaeon,
  type PaymentDraft,
} from "@/lib/spaces-store";

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search["reference"] === "string" ? search["reference"] : "",
  }),
  head: () => ({
    meta: [{ title: "Complete payment — Spaceaeon" }, { name: "robots", content: "noindex" }],
  }),
  component: PaymentPage,
});

function findValue(value: unknown, keys: Set<string>): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  for (const [key, candidate] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      keys.has(normalizedKey) &&
      (typeof candidate === "string" || typeof candidate === "number")
    ) {
      return String(candidate);
    }
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    const found = findValue(nested, keys);
    if (found) return found;
  }

  return null;
}

function findCheckoutUrl(value: unknown): string | null {
  const candidate = findValue(
    value,
    new Set(["url", "checkouturl", "authorizationurl", "paymenturl", "redirecturl"]),
  );
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function persistDraft(draft: PaymentDraft) {
  sessionStorage.setItem(`Spaceaeon.payment.${draft.reference}`, JSON.stringify(draft));
}

function PaymentPage() {
  const { reference } = Route.useSearch();
  const navigate = useNavigate();
  const { addBooking } = useSpaceaeon();
  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const autoVerifyStarted = useRef(false);

  useEffect(() => {
    if (!reference) {
      setLoadingDraft(false);
      setError(
        "This payment session is missing its reference. Return to the property page to try again.",
      );
      return;
    }

    try {
      const rawDraft = sessionStorage.getItem(`Spaceaeon.payment.${reference}`);
      if (!rawDraft) {
        setError("This payment session has expired. Return to the property page to start again.");
        return;
      }

      const storedDraft = JSON.parse(rawDraft) as PaymentDraft;
      if (storedDraft.reference !== reference || !storedDraft.propertyId || !storedDraft.roomId) {
        throw new Error("The saved payment details are invalid.");
      }
      setDraft(storedDraft);
    } catch (loadError) {
      console.error("Could not load payment session:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Could not load payment details.");
    } finally {
      setLoadingDraft(false);
    }
  }, [reference]);

  const finishPayment = useCallback(
    async (paymentDraft: PaymentDraft, payment: PaymentInitiationResponse) => {
      if (payment.status !== "success" || !paymentDraft.bookingId) return false;

      const receiptCode = paymentDraft.receiptCode || makeRef();
      addBooking({
        backendId: paymentDraft.bookingId,
        receiptCode,
        ref: receiptCode,
        propertyId: paymentDraft.propertyId,
        propertyTitle: paymentDraft.propertyTitle,
        image: paymentDraft.image,
        roomName: paymentDraft.roomName,
        checkIn: paymentDraft.checkIn,
        checkOut: paymentDraft.checkOut,
        guests: paymentDraft.guests,
        total: paymentDraft.total,
        subtotal: paymentDraft.subtotal,
        serviceFee: paymentDraft.serviceFee,
        cautionFee: paymentDraft.cautionFee,
        status: "active",
        method: paymentDraft.paymentMethod === "card" ? "Card" : "Bank transfer",
      });
      sessionStorage.removeItem(`Spaceaeon.payment.${paymentDraft.reference}`);
      toast.success("Payment confirmed. Your booking receipt is ready in My Bookings.");
      await navigate({ to: "/bookings", replace: true });
      return true;
    },
    [addBooking, navigate],
  );

  const verifyPayment = useCallback(
    async (automatic = false) => {
      if (!draft?.paymentId || busy) return;
      setBusy(true);
      setError("");

      try {
        let payment: PaymentInitiationResponse | null = null;
        const attempts = automatic ? 4 : 1;
        for (let attempt = 0; attempt < attempts; attempt++) {
          payment = await fetchPayment(draft.paymentId);
          if (payment.status !== "pending" || attempt === attempts - 1) break;
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }

        if (payment?.status === "success") {
          await finishPayment(draft, payment);
        } else if (payment?.status === "failed" || payment?.status === "refunded") {
          setError("Flutterwave did not confirm this payment. You can try again or cancel.");
        } else {
          toast.message("Payment is not confirmed yet. Please check again shortly.");
        }
      } catch (verificationError) {
        console.error("Payment verification failed:", verificationError);
        setError("We could not verify the payment right now. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, draft, finishPayment],
  );

  useEffect(() => {
    if (!draft?.paymentId || autoVerifyStarted.current) return;
    const callback = new URLSearchParams(window.location.search);
    const returnedFromGateway =
      callback.has("status") || callback.has("transaction_id") || callback.has("tx_ref");
    if (!returnedFromGateway) return;

    autoVerifyStarted.current = true;
    void verifyPayment(true);
  }, [draft, verifyPayment]);

  const beginPayment = async (method: PaymentMethod) => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");

    try {
      let activeDraft = draft;

      if (activeDraft.paymentId) {
        if (activeDraft.paymentMethod !== method) {
          setError(
            "A payment is already in progress. Verify it or cancel before choosing another method.",
          );
          return;
        }
        if (method === "card") {
          const checkoutUrl = findCheckoutUrl(activeDraft.gatewayResponse);
          if (checkoutUrl) {
            window.location.assign(checkoutUrl);
            return;
          }
          setError(
            "Flutterwave did not provide a card checkout link. Verify the payment or cancel.",
          );
        }
        return;
      }

      if (!activeDraft.bookingId) {
        const booking = await createBookingReservation({
          room_id: activeDraft.roomId,
          property_id: activeDraft.propertyId,
          check_in_date: activeDraft.checkIn,
          check_out_date: activeDraft.checkOut,
          num_guests: activeDraft.guests,
          total_price: activeDraft.total,
        });
        if (!booking.id?.trim()) {
          throw new Error("The reservation could not be created. Please try again.");
        }

        const backendReceipt = booking.receipt_code?.trim() || booking.spc_code?.trim();
        activeDraft = {
          ...activeDraft,
          bookingId: booking.id,
          receiptCode: backendReceipt || makeRef(),
        };
        persistDraft(activeDraft);
        setDraft(activeDraft);
      }

      const bookingId = activeDraft.bookingId;
      if (!bookingId) {
        throw new Error("The reservation could not be created. Please try again.");
      }

      const payment = await initiatePayment({
        booking_id: bookingId,
        amount: activeDraft.total,
        currency: "NGN",
        payment_method: method,
      });
      if (payment.status === "failed" || payment.status === "refunded") {
        throw new Error("Flutterwave could not start this payment. Please try again.");
      }

      activeDraft = {
        ...activeDraft,
        paymentId: payment.id,
        paymentReference: payment.transaction_ref || activeDraft.reference,
        paymentMethod: method,
        gatewayResponse: payment.gateway_response,
      };
      persistDraft(activeDraft);
      setDraft(activeDraft);

      if (payment.status === "success") {
        await finishPayment(activeDraft, payment);
        return;
      }

      if (method === "card") {
        const checkoutUrl = findCheckoutUrl(payment.gateway_response);
        if (checkoutUrl) {
          window.location.assign(checkoutUrl);
          return;
        }
        setError(
          "Flutterwave started the payment but did not provide a card checkout link. Verify the payment or cancel.",
        );
      }
    } catch (paymentError) {
      console.error("Could not start payment:", paymentError);
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Could not start payment. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const cancelPayment = async () => {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      if (draft?.bookingId) await cancelBookingReservation(draft.bookingId);
      if (draft) sessionStorage.removeItem(`Spaceaeon.payment.${draft.reference}`);
      if (draft?.propertyId) {
        await navigate({
          to: "/property/$id",
          params: { id: draft.propertyId },
          replace: true,
        });
      } else {
        await navigate({ to: "/", replace: true });
      }
    } catch (cancelError) {
      console.error("Could not cancel unpaid reservation:", cancelError);
      setError(
        "We could not cancel this reservation. Please retry cancellation before leaving checkout.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyAccountNumber = async () => {
    const accountNumber = draft
      ? findValue(
          draft.gatewayResponse,
          new Set(["accountnumber", "accountno", "transferaccountnumber"]),
        )
      : null;
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error("Could not copy bank account number:", copyError);
      toast.error("Could not copy the account number. Please copy it manually.");
    }
  };

  const gatewayResponse = draft?.gatewayResponse;
  const accountNumber = gatewayResponse
    ? findValue(gatewayResponse, new Set(["accountnumber", "accountno", "transferaccountnumber"]))
    : null;
  const bankName = gatewayResponse
    ? findValue(gatewayResponse, new Set(["bankname", "bank"]))
    : null;
  const transferReference = draft?.paymentReference || draft?.reference;

  if (loadingDraft) {
    return (
      <main className="grid min-h-screen place-items-center bg-white text-slate-950">
        <Loader2 className="size-7 animate-spin text-blue-700" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-600 hover:bg-slate-100"
              aria-label="Cancel payment and return to property"
              disabled={busy}
              onClick={() => void cancelPayment()}
            >
              <X className="size-5" />
            </Button>
            <div>
              <h1 className="font-display text-lg font-bold">Complete Payment</h1>
              <p className="text-xs text-slate-500">Secure checkout powered by Flutterwave</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <ShieldCheck className="size-4 text-emerald-600" />
            Secure payment
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-[minmax(0,1fr)_360px] md:px-8 md:py-12">
        <section className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-blue-700">Payment options</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Choose how to pay</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your booking is confirmed only after Flutterwave verifies your payment.
            </p>
          </div>

          <button
            type="button"
            className={`w-full rounded-2xl border p-5 text-left transition hover:border-blue-500 hover:bg-blue-50/40 ${
              draft?.paymentMethod === "card" ? "border-blue-600 bg-blue-50/50" : "border-slate-200"
            }`}
            disabled={busy || Boolean(draft?.paymentId && draft.paymentMethod !== "card")}
            onClick={() => void beginPayment("card")}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                  <CreditCard className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">
                    {draft?.paymentMethod === "card"
                      ? "Continue to Card Payment"
                      : "Debit / Credit Card"}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Pay securely with your card
                  </span>
                </span>
              </div>
              {busy && !draft?.paymentId && (
                <Loader2 className="size-5 animate-spin text-blue-700" />
              )}
            </div>
            <div
              className="mt-4 flex items-center gap-2 pl-14"
              aria-label="Accepted cards: Visa, Mastercard, and Verve"
            >
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black italic tracking-wide text-blue-800">
                VISA
              </span>
              <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700">
                <span className="flex -space-x-1" aria-hidden="true">
                  <span className="size-3 rounded-full bg-red-500/90" />
                  <span className="size-3 rounded-full bg-amber-400/90" />
                </span>
                Mastercard
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-700">
                Verve
              </span>
            </div>
          </button>

          <section
            className={`rounded-2xl border p-5 ${
              draft?.paymentMethod === "bank_transfer"
                ? "border-blue-600 bg-blue-50/30"
                : "border-slate-200"
            }`}
          >
            <button
              type="button"
              className="w-full text-left disabled:cursor-not-allowed"
              disabled={busy || Boolean(draft?.paymentId)}
              onClick={() => void beginPayment("bank_transfer")}
            >
              <span className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <span className="text-lg font-bold">₦</span>
                  </span>
                  <span>
                    <span className="block font-semibold">Bank Transfer</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Transfer to a secure virtual account
                    </span>
                  </span>
                </span>
                {busy && draft?.paymentMethod === "bank_transfer" && (
                  <Loader2 className="size-5 animate-spin text-blue-700" />
                )}
              </span>
            </button>

            {draft?.paymentMethod === "bank_transfer" && (
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <PaymentDetail label="Bank name" value={bankName || "Preparing bank details..."} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Account number</p>
                    <p className="mt-1 font-mono text-lg font-semibold">
                      {accountNumber || "Preparing account details..."}
                    </p>
                  </div>
                  {accountNumber && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => void copyAccountNumber()}
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  )}
                </div>
                <PaymentDetail
                  label="Amount"
                  value={draft ? formatMoney(draft.total, "NGN") : ""}
                />
                <PaymentDetail label="Reference" value={transferReference || ""} />
                <p className="rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
                  Transfer the exact amount to the account above. Your booking will be confirmed
                  after Flutterwave verifies the transfer.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={busy || !draft.paymentId}
                  onClick={() => void verifyPayment()}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  Verify payment
                </Button>
              </div>
            )}
          </section>

          {draft?.paymentId && draft.paymentMethod === "card" && (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              disabled={busy}
              onClick={() => void verifyPayment()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Verify card payment
            </Button>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-display text-lg font-bold">Booking summary</h2>
          {draft ? (
            <div className="mt-4 space-y-4">
              {draft.image && (
                <img src={draft.image} alt="" className="h-40 w-full rounded-xl object-cover" />
              )}
              <div>
                <p className="font-semibold">{draft.propertyTitle}</p>
                <p className="mt-1 text-sm text-slate-600">{draft.roomName}</p>
              </div>
              <div className="space-y-2 border-y border-slate-200 py-4 text-sm">
                <PaymentDetail label="Check-in" value={formatShortDate(draft.checkIn)} />
                <PaymentDetail label="Check-out" value={formatShortDate(draft.checkOut)} />
                <PaymentDetail
                  label="Nights"
                  value={String(nightsBetween(draft.checkIn, draft.checkOut))}
                />
                <PaymentDetail label="Guests" value={String(draft.guests)} />
                <PaymentDetail label="Booking reference" value={draft.reference} />
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="font-display text-xl">{formatMoney(draft.total, "NGN")}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              {error || "No booking details are available for this payment."}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

function PaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
