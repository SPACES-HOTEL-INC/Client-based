import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, FileText, AlertOctagon, ChevronRight } from "lucide-react";

type SearchParams = {
  section?: "privacy" | "terms" | "prohibited";
};

export const Route = createFileRoute("/legal")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      section: (search.section as SearchParams["section"]) || undefined,
    };
  },
  head: () => ({
    meta: [{ title: "Legal — Spaces" }],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { section } = useSearch({ from: "/legal" });
  const [activeTab, setActiveTab] = useState<"privacy" | "terms" | "prohibited">(
    section || "privacy"
  );

  // If a section search parameter is passed (or active detail view), show the Policy Document Viewer
  if (section) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Detail Header */}
        <header className="sticky top-0 z-10 flex items-center gap-4 bg-background px-5 py-4 border-b border-border">
          <Link to="/legal" className="p-1 text-foreground hover:opacity-80">
            <ArrowLeft className="size-6" />
          </Link>
          <h1 className="text-xl font-bold">
            {activeTab === "privacy" && "Privacy Policy"}
            {activeTab === "terms" && "Terms of Use"}
            {activeTab === "prohibited" && "Prohibited Items Policy"}
          </h1>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`py-3 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "privacy"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`py-3 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "terms"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Terms of Use
          </button>
          <button
            onClick={() => setActiveTab("prohibited")}
            className={`py-3 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "prohibited"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Prohibited Items
          </button>
        </div>

        {/* Policy Content */}
        <main className="max-w-3xl mx-auto px-5 py-6 text-sm text-muted-foreground leading-relaxed space-y-6">
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">1. Information Collection</h2>
              <p>
                At Spaces, we collect personal information necessary to process your bookings, manage account access, and ensure security across our properties and services.
              </p>
              <h2 className="text-lg font-bold text-foreground">2. Use of Data</h2>
              <p>
                Your data is strictly used for payment confirmation, communication with hosts/concierge staff, and personalized platform experiences. We do not sell your personal data.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">1. User Agreement</h2>
              <p>
                By using Spaces, you agree to abide by all platform rules, check-in schedules, and respect the property guidelines set forth by hosts and partners.
              </p>
              <h2 className="text-lg font-bold text-foreground">2. Cancellations & Refunds</h2>
              <p>
                Cancellation eligibility varies per property. Approved refunds will be processed back to the original payment method or wallet balance.
              </p>
            </div>
          )}

          {activeTab === "prohibited" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">1. Restricted Items & Activities</h2>
              <p>
                Guests and hosts are strictly prohibited from bringing illegal substances, unlicensed firearms, hazardous materials, or unauthorized commercial equipment to properties.
              </p>
              <h2 className="text-lg font-bold text-foreground">2. Enforcement</h2>
              <p>
                Violation of prohibited items policies will lead to immediate reservation termination without refund and account suspension.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Main Legal Sub-Menu Screen
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background px-5 py-4 border-b border-border">
        <Link to="/profile" className="p-1 text-foreground hover:opacity-80">
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-xl font-bold">Legal</h1>
      </header>

      {/* Legal Options List */}
      <main className="max-w-2xl mx-auto px-5 pt-4 divide-y divide-border/60">
        <Link
          to="/legal"
          search={{ section: "privacy" }}
          className="flex items-center justify-between py-4 group"
        >
          <div className="flex items-center gap-4">
            <ShieldCheck className="size-5 text-foreground" />
            <span className="text-base font-medium">Privacy Policy</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/legal"
          search={{ section: "terms" }}
          className="flex items-center justify-between py-4 group"
        >
          <div className="flex items-center gap-4">
            <FileText className="size-5 text-foreground" />
            <span className="text-base font-medium">Terms of Use</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/legal"
          search={{ section: "prohibited" }}
          className="flex items-center justify-between py-4 group"
        >
          <div className="flex items-center gap-4">
            <AlertOctagon className="size-5 text-foreground" />
            <span className="text-base font-medium">Prohibited Items Policy</span>
          </div>
          <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </main>
    </div>
  );
}