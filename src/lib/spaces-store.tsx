import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Currency = "NGN" | "USD";
export const USD_RATE = 1600;

export type User = { firstName: string; email: string; guest: boolean };

export type Booking = {
  ref: string;
  propertyId: string;
  propertyTitle: string;
  image: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number; // NGN
  status: "active" | "pending" | "past";
  method: string;
};

type Ctx = {
  user: User;
  currency: Currency;
  bookings: Booking[];
  favorites: string[];
  hydrated: boolean;
  setCurrency: (c: Currency) => void;
  signIn: (firstName: string, email: string) => void;
  signOut: () => void;
  addBooking: (b: Booking) => void;
  toggleFavorite: (id: string) => void;
};

const GUEST: User = { firstName: "Abubakar", email: "", guest: true };

const SpacesContext = createContext<Ctx | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function SpacesProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(GUEST);
  const [currency, setCurrencyState] = useState<Currency>("NGN");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(read<User>("spaces.user", GUEST));
    setCurrencyState(read<Currency>("spaces.currency", "NGN"));
    setBookings(read<Booking[]>("spaces.bookings", []));
    setFavorites(read<string[]>("spaces.favorites", []));
    setHydrated(true);
  }, []);

  const persist = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<Ctx>(
    () => ({
      user,
      currency,
      bookings,
      favorites,
      hydrated,
      setCurrency: (c) => {
        setCurrencyState(c);
        persist("spaces.currency", c);
      },
      signIn: (firstName, email) => {
        const next: User = { firstName, email, guest: false };
        setUser(next);
        persist("spaces.user", next);
      },
      signOut: () => {
        setUser(GUEST);
        persist("spaces.user", GUEST);
      },
      addBooking: (b) => {
        setBookings((prev) => {
          const next = [b, ...prev];
          persist("spaces.bookings", next);
          return next;
        });
      },
      toggleFavorite: (id) => {
        setFavorites((prev) => {
          const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
          persist("spaces.favorites", next);
          return next;
        });
      },
    }),
    [user, currency, bookings, favorites, hydrated],
  );

  return <SpacesContext.Provider value={value}>{children}</SpacesContext.Provider>;
}

export function useSpaces() {
  const ctx = useContext(SpacesContext);
  if (!ctx) throw new Error("useSpaces must be used inside SpacesProvider");
  return ctx;
}

export function formatMoney(ngn: number, currency: Currency) {
  if (currency === "USD") {
    const usd = ngn / USD_RATE;
    return `$${usd.toLocaleString("en-US", { maximumFractionDigits: usd < 100 ? 2 : 0 })}`;
  }
  return `₦${Math.round(ngn).toLocaleString("en-NG")}`;
}

export function makeRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `SPC-${out}`;
}

export function nightsBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}
