import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Headphones, Phone, Mail, Send } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useSpaces } from "@/lib/spaces-store";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support & help centre — Spaces" },
      { name: "description", content: "Chat with a Spaces concierge or browse answers on bookings, payments and refunds." },
      { property: "og:title", content: "Support & help centre — Spaces" },
      { property: "og:description", content: "Live concierge chat and answers to common booking questions." },
    ],
  }),
  component: SupportPage,
});

type Msg = { id: number; from: "agent" | "me"; text: string };

const faqs = [
  {
    q: "How do I confirm a bank transfer payment?",
    a: "Send the exact amount to the dedicated Wema Bank account shown at checkout. Your booking moves from Pending to Active automatically once the transfer is matched, usually within two minutes.",
  },
  {
    q: "Can I pay in US Dollars?",
    a: "Yes. Use the currency toggle on the Home or Profile screen to switch between ₦ NGN and $ USD. All room rates, fees and totals update instantly.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Most spaces offer free cancellation up to 48 hours before check-in. The exact policy appears on the property page before you pay.",
  },
  {
    q: "Where do I find my booking reference?",
    a: "Every confirmed reservation gets a code like SPC-4KD92X. You'll find it on the confirmation screen and on the booking pass in the Bookings tab.",
  },
];

function SupportPage() {
  const { user } = useSpaces();
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, from: "agent", text: `Hi ${user.firstName}, I'm Zainab from the Spaces concierge. How can I help today?` },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const id = Date.now();
    setMessages((m) => [...m, { id, from: "me", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: id + 1,
          from: "agent",
          text: "Thanks for that — I'm pulling up your reservation now. A concierge will follow up here within a minute.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 pt-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground">Concierge available 24/7</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
          <Headphones className="size-6" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href="tel:+2348000000000"
          className="card-elevated flex items-center gap-3 p-4 text-sm font-medium"
        >
          <Phone className="size-4 text-primary" /> Call us
        </a>
        <a
          href="mailto:concierge@spaces.ng"
          className="card-elevated flex items-center gap-3 p-4 text-sm font-medium"
        >
          <Mail className="size-4 text-primary" /> Email
        </a>
      </div>

      <section className="card-elevated flex h-96 flex-col overflow-hidden">
        <div className="brand-surface px-4 py-3">
          <p className="text-sm font-semibold">Live chat · Zainab</p>
          <p className="text-xs text-brand-foreground/70">Typically replies in under a minute</p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === "me"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="min-h-11 flex-1 rounded-xl bg-secondary px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-xl" aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-semibold">Help centre</h2>
        <Accordion type="single" collapsible className="card-elevated px-4">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
