import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Mail, Twitter, Instagram, AlertTriangle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [{ title: "Get Help — Spaces" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background px-5 py-4 border-b border-border">
        <Link to="/profile" className="p-1 text-foreground hover:opacity-80">
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-xl font-bold">Get Help</h1>
      </header>

      {/* Help Options Menu */}
      <main className="max-w-2xl mx-auto px-5 pt-4 divide-y divide-border/60">
        <Link to="/support" className="flex items-center justify-between py-4 group">
          <div className="flex items-center gap-4">
            <MessageSquare className="size-5 text-foreground" />
            <span className="text-base font-medium">Chat</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <a 
          href="mailto:concierge@spaces.ng" 
          className="flex items-center justify-between py-4 group"
        >
          <div className="flex items-center gap-4">
            <Mail className="size-5 text-foreground" />
            <span className="text-base font-medium">Email</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a 
          href="https://twitter.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-between py-4 group"
        >
          <div className="flex items-center gap-4">
            <Twitter className="size-5 text-foreground" />
            <span className="text-base font-medium">Twitter</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-between py-4 group"
        >
          <div className="flex items-center gap-4">
            <Instagram className="size-5 text-foreground" />
            <span className="text-base font-medium">Instagram</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </a>

        <Link to="/legal" search={{ section: "prohibited" }} className="flex items-center justify-between py-4 group">
          <div className="flex items-center gap-4">
            <AlertTriangle className="size-5 text-foreground" />
            <span className="text-base font-medium">Prohibited_items</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </main>
    </div>
  );
}