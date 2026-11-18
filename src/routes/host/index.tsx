import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarCheck,
  CircleDollarSign,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { normalizePropertyType, type PropertyType } from "@/lib/data";
import { formatMoney, useSpaceaeon } from "@/lib/spaces-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/host/")({
  head: () => ({
    meta: [{ title: "Host Dashboard — Spaceaeon" }],
  }),
  component: HostDashboardPage,
});

interface HostStats {
  totalEarnings: number;
  activeListings: number;
  totalBookings: number;
  occupancyRate: number;
}

interface HostBooking {
  id: string;
  ref: string;
  guestName: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: "confirmed" | "pending" | "cancelled";
}

interface HostProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  type?: PropertyType;
  status: "active" | "draft" | "unlisted";
  image: string;
}

function HostDashboardPage() {
  const { currency, user } = useSpaceaeon();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HostStats>({
    totalEarnings: 0,
    activeListings: 0,
    totalBookings: 0,
    occupancyRate: 0,
  });
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [properties, setProperties] = useState<HostProperty[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchHostData = async () => {
      try {
        setLoading(true);

        const [bookingsRes, propsRes] = await Promise.allSettled([
          api.get("/bookings/host-bookings"),
          api.get("/properties/mine"),
        ]);

        if (!mounted) return;

        // 1. Process Bookings
        let hostBookings: HostBooking[] = [];
        if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data) {
          const rawBookings = bookingsRes.value.data.data || bookingsRes.value.data;
          if (Array.isArray(rawBookings)) {
            hostBookings = rawBookings.map((b: any) => ({
              id: String(b.id),
              ref: b.reference || b.ref || "",
              guestName: b.guest_name || b.guestName || "Guest",
              propertyTitle: b.property_title || b.space_name || "Hosted Space",
              checkIn: b.check_in || "",
              checkOut: b.check_out || "",
              totalAmount: b.total_amount || b.price || 0,
              status: b.status || "pending",
            }));
          }
        }
        setBookings(hostBookings);

        // 2. Process Host Properties
        let hostProperties: HostProperty[] = [];
        if (propsRes.status === "fulfilled" && propsRes.value?.data) {
          const rawProps = propsRes.value.data.data || propsRes.value.data;
          if (Array.isArray(rawProps)) {
            hostProperties = rawProps.map((p: any) => ({
              id: String(p.id),
              title: p.title || p.name || "Hosted Space",
              city: p.city || "Lagos",
              price: p.price || p.price_per_night || 0,
              type: normalizePropertyType(p.property_type ?? p.type),
              status: p.is_active ? "active" : "unlisted",
              image: p.image_url || p.images?.[0] || "",
            }));
          }
        }
        setProperties(hostProperties);
        setStats({
          totalEarnings: hostBookings
            .filter((booking) => booking.status === "confirmed")
            .reduce((sum, booking) => sum + booking.totalAmount, 0),
          activeListings: hostProperties.filter((property) => property.status === "active").length,
          totalBookings: hostBookings.length,
          occupancyRate: hostProperties.length
            ? Math.round((hostProperties.filter((property) => property.status === "active").length / hostProperties.length) * 100)
            : 0,
        });
      } catch (err) {
        console.error("Failed to load host dashboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHostData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: "confirmed" | "cancelled") => {
    if (newStatus === "confirmed") {
      toast.error("The backend does not currently expose a booking confirmation action.");
      return;
    }

    try {
      await api.delete(`/bookings/${encodeURIComponent(bookingId)}`);
      toast.success("Booking cancelled successfully");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (e) {
      toast.error("Could not cancel this booking.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading host overview...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10 space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            Welcome back, {user?.firstName || "Host"}
          </h1>
          <p className="text-sm text-muted-foreground">Manage your Spaceaeon, reservations, and revenue.</p>
        </div>
        <Link to="/host/create">
          <Button className="rounded-xl gap-2 h-11">
            <Plus className="size-4" /> Add new space
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
            <CircleDollarSign className="size-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{formatMoney(stats.totalEarnings, currency)}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Listings</span>
            <Building2 className="size-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.activeListings}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reservations</span>
            <CalendarCheck className="size-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.totalBookings}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupancy Rate</span>
            <TrendingUp className="size-5 text-primary" />
          </div>
          <p className="font-display text-2xl font-bold">{stats.occupancyRate}%</p>
        </div>
      </div>

      {/* Guest Reservations Section */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Recent Reservations</h2>
        {bookings.length === 0 ? (
          <div className="card-elevated p-8 text-center text-muted-foreground">
            No incoming bookings yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => (
              <div key={b.id} className="card-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold">{b.guestName}</span>
                    <Badge variant={b.status === "confirmed" ? "default" : b.status === "pending" ? "secondary" : "destructive"}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{b.propertyTitle} · <span className="font-medium text-foreground">{b.ref}</span></p>
                  <p className="text-xs text-muted-foreground">{b.checkIn} → {b.checkOut}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className="font-display font-bold text-base">{formatMoney(b.totalAmount, currency)}</span>
                  {b.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="rounded-lg gap-1 text-success border-success" onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}>
                        <CheckCircle2 className="size-4" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1 text-destructive border-destructive" onClick={() => handleUpdateBookingStatus(b.id, "cancelled")}>
                        <XCircle className="size-4" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hosted Properties Section */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Your Managed Properties</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className="card-elevated overflow-hidden">
              <img src={p.image} alt={p.title} className="h-40 w-full object-cover" />
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold line-clamp-1">{p.title}</p>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
                {p.type && <Badge variant="secondary">{p.type}</Badge>}
                <p className="text-sm text-muted-foreground">{p.city}</p>
                <p className="font-display font-bold text-base">{formatMoney(p.price, currency)} / night</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}