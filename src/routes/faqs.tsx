import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — Spaces" },
      { name: "description", content: "Frequently asked questions and answers about Spaces." },
    ],
  }),
  component: FAQsPage,
});

const FAQ_DATA = [
  {
    q: "What is Spaces?",
    a: "Spaces is a platform for finding and booking unique venues, studios, staycation spots, and event halls.",
  },
  {
    q: "Do I need an account to use Spaces?",
    a: "You can browse listings as a guest, but you'll need an account to book or save spaces.",
  },
  {
    q: "How do I create an account?",
    a: "Tap on 'Sign in or create an account' in the Profile tab, fill in your details, and verify your phone/email.",
  },
  {
    q: "I didn't receive my OTP. What should I do?",
    a: "Check your signal coverage, wait 60 seconds, and tap 'Resend OTP'. Ensure your phone number is typed correctly.",
  },
  {
    q: "Can I update my profile information?",
    a: "Yes, go to Profile > Personal details to edit your name, phone number, and account settings.",
  },
  {
    q: "How do I find what I'm looking for?",
    a: "Use the Search tab to filter listings by category, location, price, and availability dates.",
  },
  {
    q: "Can I filter listings?",
    a: "Yes! Click the filter icon on the Search page to filter by capacity, price range, amenities, and host options.",
  },
  {
    q: "How do I make a booking?",
    a: "Select your desired space, pick your dates/time slots, tap 'Book Now', and complete the checkout payment.",
  },
  {
    q: "Can I book multiple items or days at once?",
    a: "Yes, you can select multi-day ranges or multiple time slots for studios and event spaces.",
  },
  {
    q: "How do I know if my booking is confirmed?",
    a: "You will receive an instant push notification, an email confirmation, and see the active booking status under the Bookings tab.",
  },
  {
    q: "Where can I see my bookings?",
    a: "All active, upcoming, and past reservations are listed in the 'Bookings' tab on the bottom menu bar.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept debit cards, direct bank transfers via Paystack/Flutterwave, and Spaces Wallet balances.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes, all transactions are processed through PCI-DSS compliant payment gateways with full encryption.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Cancellations depend on the host's cancellation policy. Check your booking details page to request a cancellation.",
  },
  {
    q: "Will I get a refund if I cancel?",
    a: "Refunds are processed automatically based on the listing's cancellation window (e.g., full refund 48 hours prior).",
  },
  {
    q: "How long do refunds take?",
    a: "Approved refunds are credited to your Spaces Wallet immediately, or to your bank account within 3–5 working days.",
  },
  {
    q: "How do I contact support?",
    a: "Go to Profile > Get Help to chat with our team or access social/email channels.",
  },
];

function FAQsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Top Bar - Only Back Arrow */}
      <div className="sticky top-0 z-10 flex items-center bg-background/95 backdrop-blur px-5 py-4 border-b border-border">
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          className="p-2 rounded-full hover:bg-secondary transition"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground mt-1">We've answered some important questions here</p>
        </div>

        {/* Accordion FAQ List */}
        <Accordion type="single" collapsible className="space-y-3 pt-2">
          {FAQ_DATA.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="border border-border rounded-2xl px-4 py-1 bg-card shadow-sm"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <span className="text-left pr-2">{item.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}