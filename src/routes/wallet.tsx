import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building, Check, ChevronRight, Copy, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Your wallet — Spaceaeon" },
      { name: "description", content: "Manage your Spaceaeon wallet and withdrawal accounts." },
    ],
  }),
  component: WalletPage,
});

const NIGERIAN_BANKS = [
  "Access Bank",
  "Guaranty Trust Bank (GTB)",
  "First Bank of Nigeria",
  "Zenith Bank",
  "Kuda Bank",
  "OPay",
  "Palmpay",
  "UBA",
  "Wema Bank",
  "Moniepoint Microfinance Bank",
];

type WithdrawalAccount = { bank: string; number: string; name: string };

function WalletPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<WithdrawalAccount[]>([]);

  const isGuest = !user?.email;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("9779944969");
      setCopied(true);
      toast.success("Account number copied to clipboard!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy wallet account number:", error);
      toast.error("Could not copy the account number.");
    }
  };

  const handleAddWithdrawalAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBank || accountNumber.length !== 10) {
      toast.error("Please select a bank and enter a valid 10-digit account number.");
      return;
    }

    setSavedAccounts((accounts) => [
      ...accounts,
      { bank: selectedBank, number: accountNumber, name: accountName || "Verified Account" },
    ]);
    toast.success("Withdrawal account saved successfully!");
    setWithdrawalModalOpen(false);
    setSelectedBank("");
    setAccountNumber("");
    setAccountName("");
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Loading wallet…
      </div>
    );
  }

  if (isGuest) {
    return (
      <SignInRequiredModal isOpen onClose={() => navigate({ to: "/profile", replace: true })} />
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-5 pb-24 pt-6 md:px-10">
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          aria-label="Back to profile"
          className="grid size-10 place-items-center rounded-full bg-secondary text-foreground transition hover:bg-accent"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your balance and payment accounts</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border">
        <div className="space-y-5 bg-emerald-900 p-6 text-white md:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold">
              <Wallet className="size-5" /> Wallet balance
            </span>
            <button
              type="button"
              onClick={() => toast.info("Direct funding initiated")}
              className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs backdrop-blur transition hover:bg-white/30"
            >
              <Plus className="size-3" /> Add Money
            </button>
          </div>

          <div className="py-2 text-center">
            <p className="text-xs text-emerald-200">Total Balance · NGN</p>
            <p className="mt-1 text-4xl font-extrabold">₦0</p>
          </div>

          <div className="flex items-center justify-between rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm">
            <span className="truncate">Paystack-Titan | 9779944969</span>
            <button
              type="button"
              aria-label="Copy wallet account number"
              onClick={handleCopy}
              className="rounded-full p-1 hover:bg-slate-100"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 divide-x divide-emerald-800/60 pt-2 text-center text-xs">
            <div>
              <p className="text-emerald-300">MAIN BALANCE</p>
              <p className="mt-0.5 text-base font-bold text-white">₦0</p>
            </div>
            <div>
              <p className="text-emerald-300">Spaceaeon CREDITS</p>
              <p className="mt-0.5 text-base font-bold text-white">₦0</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 bg-card p-5 md:p-6">
          <button
            type="button"
            onClick={() => setWithdrawalModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border p-3.5 text-sm font-medium transition hover:bg-secondary"
          >
            <span className="flex items-center gap-2.5">
              <Building className="size-4 text-emerald-600" /> Refund / Withdraw to bank
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Manage Withdrawal Accounts
              </h2>
              <button
                type="button"
                onClick={() => setWithdrawalModalOpen(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                + Add New
              </button>
            </div>
            {savedAccounts.length === 0 ? (
              <p className="py-2 text-xs italic text-muted-foreground">
                No bank accounts added yet.
              </p>
            ) : (
              savedAccounts.map((account, index) => (
                <div
                  key={`${account.number}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-border p-3 text-xs"
                >
                  <div>
                    <p className="font-bold">{account.bank}</p>
                    <p className="text-muted-foreground">
                      {account.number} · {account.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Manage Cards
            </h2>
            <button
              type="button"
              onClick={() => toast.info("Card linking gateway feature")}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border p-3 text-xs font-medium transition hover:bg-secondary"
            >
              <Plus className="size-4 text-primary" /> Add new debit card
            </button>
          </section>
        </div>
      </section>

      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Withdrawal Bank Account</DialogTitle>
            <DialogDescription>
              Enter your bank details to receive withdrawals and refunds.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddWithdrawalAccount} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="bank">Select Bank</Label>
              <select
                id="bank"
                value={selectedBank}
                onChange={(event) => setSelectedBank(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Choose Bank --</option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(event) => {
                  setAccountNumber(event.target.value);
                  setAccountName(event.target.value.length === 10 ? "Verified Account Holder" : "");
                }}
                className="h-11 rounded-xl"
              />
            </div>

            {accountName && (
              <p className="rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40">
                Account Name: <strong>{accountName}</strong>
              </p>
            )}

            <Button type="submit" className="h-11 w-full rounded-xl">
              Save Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
