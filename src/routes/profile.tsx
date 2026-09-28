import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Ticket,
  UserRound,
  Wallet,
  Building,
  Copy,
  Check,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SignInRequiredModal } from "@/components/spaces/SignInRequiredModal";
import { useAuth } from "@/hooks/useAuth";
import { useSpaces } from "@/lib/spaces-store";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Spaces" },
      { name: "description", content: "Manage your Spaces account, wallet, bank withdrawal details, and preferences." },
    ],
  }),
  component: ProfilePage,
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

function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { currency, bookings, favorites } = useSpaces();
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Dialog States
  const [signInRequiredOpen, setSignInRequiredOpen] = useState(false);
  const [personalDetailsOpen, setPersonalDetailsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form States
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<Array<{ bank: string; number: string; name: string }>>([]);

  const isGuest = !user || !user.email;
  const displayName = user?.full_name || (user?.email ? user.email.split("@")[0] : "Guest");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedUser = await res.json();
      updateUser(updatedUser);
      toast.success("Personal details updated successfully!");
      setPersonalDetailsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Could not update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Account number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddWithdrawalAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || accountNumber.length !== 10) {
      toast.error("Please select a bank and enter a valid 10-digit account number.");
      return;
    }
    const newAcc = { bank: selectedBank, number: accountNumber, name: accountName || "Verified Account" };
    setSavedAccounts([...savedAccounts, newAcc]);
    toast.success("Withdrawal account saved successfully!");
    setWithdrawalModalOpen(false);
    setSelectedBank("");
    setAccountNumber("");
    setAccountName("");
  };

  const handleActionIntercept = (callback: () => void) => {
    if (isGuest) {
      setSignInRequiredOpen(true);
    } else {
      callback();
    }
  };

  return (
    <div className="pb-24">
      {/* Original Header Profile Section restored */}
      <header className="brand-surface rounded-b-[2rem] px-5 pt-8 pb-14">
        <div className="mx-auto flex max-w-5xl items-center gap-4 md:px-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-foreground/15 font-display text-2xl font-bold text-brand-foreground">
            {displayName ? displayName.charAt(0).toUpperCase() : "G"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold text-brand-foreground">
              {isGuest ? "Browsing as Guest" : displayName}
            </p>
            <p className="truncate text-sm text-brand-foreground/70">
              {isGuest ? "Sign in to unlock full features" : user.email}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-8 max-w-5xl space-y-5 px-5 md:px-10">
        {/* Quick Stats Bar */}
        <div className="card-elevated grid grid-cols-2 divide-x divide-border">
          <Stat label="Bookings" value={String(bookings.length)} icon={<Ticket className="size-4" />} />
          <Stat label="Saved spaces" value={String(favorites.length)} icon={<Heart className="size-4" />} />
        </div>

        {/* Account Settings Menu */}
        <section className="card-elevated divide-y divide-border">
          <Row
            icon={<UserRound className="size-4" />}
            label="Personal details"
            onClick={() => handleActionIntercept(() => {
              setFullName(user?.full_name || "");
              setPhone(user?.phone_number || "");
              setPersonalDetailsOpen(true);
            })}
          />
          <Row
            icon={<Wallet className="size-4" />}
            label="Wallet"
            onClick={() => handleActionIntercept(() => setWalletOpen(true))}
          />
          <Link
            to="/bookings"
            onClick={(e) => {
              if (isGuest) {
                e.preventDefault();
                setSignInRequiredOpen(true);
              }
            }}
            className="block"
          >
            <Row icon={<Ticket className="size-4" />} label="Booking history" />
          </Link>
          <Row
            icon={<ShieldCheck className="size-4" />}
            label="Security & privacy"
            onClick={() => handleActionIntercept(() => toast.info("Security settings up to date."))}
          />
        </section>

        {/* Preferences Section */}
        <section className="card-elevated divide-y divide-border">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Globe className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Language</span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">English (US)</span>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <CreditCard className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Display currency</span>
            </span>
            <span className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold">
              {currency === "NGN" ? "₦ NGN" : "$ USD"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Bell className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Booking notifications</span>
            </span>
            <Switch defaultChecked onCheckedChange={(v) => toast.success(v ? "Notifications on" : "Notifications off")} />
          </div>
        </section>

        {/* Get Help, FAQs, and Legal Section */}
        <section className="card-elevated divide-y divide-border">
          <Link to="/help" className="block">
            <Row icon={<MessageCircle className="size-4" />} label="Get Help" />
          </Link>
          <Row
            icon={<HelpCircle className="size-4" />}
            label="FAQs"
            onClick={() => navigate({ to: "/faqs" })}
          />
          <Link to="/legal" className="block">
            <Row icon={<FileText className="size-4" />} label="Legal" />
          </Link>
        </section>

        {/* Direct Link to Login Page */}
        {isGuest ? (
          <Link
            to="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Sign In
          </Link>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-base text-destructive hover:text-destructive"
            onClick={() => {
              logout();
              toast.success("Signed out successfully");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">Spaces · v1.0.0</p>
      </div>

      {/* MODALS */}
      <Dialog open={personalDetailsOpen} onOpenChange={setPersonalDetailsOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Personal Details</DialogTitle>
            <DialogDescription>Update your personal information below.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-4" onSubmit={handleUpdateProfile}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled className="h-11 rounded-xl bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="h-11 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={isUpdating} className="h-11 w-full rounded-xl flex items-center justify-center gap-2">
              {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* WALLET VIEW MODAL */}
      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="bg-emerald-900 text-white p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 font-semibold"><Wallet className="size-5" /> Wallet</span>
              <button
                type="button"
                onClick={() => toast.info("Direct funding initiated")}
                className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur transition"
              >
                <Plus className="size-3" /> Add Money
              </button>
            </div>

            <div className="text-center py-2">
              <p className="text-xs text-emerald-200">Total Balance · NGN</p>
              <p className="text-4xl font-extrabold mt-1">₦0</p>
            </div>

            <div className="bg-white text-slate-900 rounded-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-sm">
              <span className="truncate">Paystack-Titan | 9779944969</span>
              <button
                type="button"
                onClick={() => handleCopy("9779944969")}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 divide-x divide-emerald-800/60 pt-2 text-center text-xs">
              <div>
                <p className="text-emerald-300">MAIN BALANCE</p>
                <p className="text-base font-bold text-white mt-0.5">₦0</p>
              </div>
              <div>
                <p className="text-emerald-300">SPACES CREDITS</p>
                <p className="text-base font-bold text-white mt-0.5">₦0</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => setWithdrawalModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-secondary transition text-sm font-medium"
            >
              <span className="flex items-center gap-2.5"><Building className="size-4 text-emerald-600" /> Refund / Withdraw to bank</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manage Withdrawal Accounts</p>
                <button
                  type="button"
                  onClick={() => setWithdrawalModalOpen(true)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  + Add New
                </button>
              </div>

              {savedAccounts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No bank accounts added yet.</p>
              ) : (
                savedAccounts.map((acc, i) => (
                  <div key={i} className="p-3 border border-border rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">{acc.bank}</p>
                      <p className="text-muted-foreground">{acc.number} · {acc.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manage Cards</p>
              <button
                type="button"
                onClick={() => toast.info("Card linking gateway feature")}
                className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-border hover:bg-secondary text-xs font-medium"
              >
                <Plus className="size-4 text-primary" /> Add new debit card
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD WITHDRAWAL ACCOUNT MODAL */}
      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Withdrawal Bank Account</DialogTitle>
            <DialogDescription>Enter your bank details to receive withdrawals and refunds.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddWithdrawalAccount} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label>Select Bank</Label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Choose Bank --</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accNo">Account Number</Label>
              <Input
                id="accNo"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  if (e.target.value.length === 10) {
                    setAccountName("Verified Account Holder");
                  } else {
                    setAccountName("");
                  }
                }}
                className="h-11 rounded-xl"
              />
            </div>

            {accountName && (
              <p className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg">
                Account Name: <strong>{accountName}</strong>
              </p>
            )}

            <Button type="submit" className="h-11 w-full rounded-xl">Save Account</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action intercept modal when guest clicks restricted item */}
      <SignInRequiredModal isOpen={signInRequiredOpen} onClose={() => setSignInRequiredOpen(false)} />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </span>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Row({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">{icon}</span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}