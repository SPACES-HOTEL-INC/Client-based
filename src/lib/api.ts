import { getPropertyDisplayName, normalizePropertyType, properties, type Property as FrontProperty, type Room as FrontRoom } from "./data";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// 1. Define clean base URL enforcing HTTPS and avoiding duplicate path segments
function resolveApiBase(value: string | undefined) {
  const base = value?.trim() || "https://backend-production-0623a.up.railway.app";
  const url = new URL(base);
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (url.protocol === "http:" && (!import.meta.env.DEV || !isLocalhost)) {
    url.protocol = "https:";
  }

  return url.toString().replace(/\/$/, "");
}

// Base URL without /api/v1 so we can append it cleanly
export const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL || 'https://backend-production-0623a.up.railway.app');

// Simple in-memory cache for GET results (stale-while-revalidate)
const CACHE_TTL = 30 * 1000; // 30s
const cache = new Map<string, { ts: number; data: any }>();

function getCacheKey(path: string, qs?: URLSearchParams) {
  return qs && qs.toString() ? `${path}?${qs.toString()}` : path;
}

type BackendProperty = Record<string, any>;
type BackendRoom = Record<string, any>;

function mapRoom(b: BackendRoom): FrontRoom {
  const id = String(b.id ?? b._id ?? "");
  const name = b.title ?? b.name ?? "Room";
  const occupancy = b.capacity ?? b.occupancy ?? 2;
  const bed = b.bed ?? "1 King bed";
  const size = b.size ?? 25;
  const amenities = b.amenities ?? [];
  const rate = Math.round(b.price_per_night ?? b.price ?? 0);
  const images = Array.isArray(b.images) ? b.images.filter((image: unknown): image is string => typeof image === "string") : undefined;
  return {
    id,
    name,
    occupancy,
    bed,
    size,
    amenities: Array.isArray(amenities) ? amenities : [],
    rate,
    image: typeof b.image === "string" ? b.image : undefined,
    images,
    image_url: typeof b.image_url === "string" ? b.image_url : undefined,
  };
}

function mapProperty(b: BackendProperty, rooms: FrontRoom[]): FrontProperty {
  const id = String(b.id ?? b._id ?? "");
  const title = getPropertyDisplayName(b.hotel_name, b.title, b.name, "Untitled");
  const city = b.city ?? "";
  const state = b.state ?? "";
  const address = b.address ?? "";
  const type = normalizePropertyType(b.property_type) ?? "Hotel";
  const rating = Number(b.avg_rating ?? 0) || 0;
  const reviews = Number(b.total_reviews ?? 0) || 0;
  const price = rooms.length ? Math.min(...rooms.map((r) => r.rate)) : 0;
  const capacity = Math.max(1, ...(rooms.map((r) => r.occupancy || 1)));
  const beds = rooms.length;
  const baths = 1;
  const host = getPropertyDisplayName(b.hotel_name, b.title, b.name);
  const images = Array.isArray(b.images) ? b.images : b.images ? [b.images] : [];
  const description = b.description ?? "";
  const amenities = b.amenities ?? [];
  const facilities = [{ group: "Amenities", items: Array.isArray(amenities) ? amenities : [] }];
  const coords = { x: 0, y: 0 };
  
  const hotel_name = b.hotel_name ?? title;
  const avg_rating = rating;
  const total_reviews = reviews;
  const price_per_night = price;

  return {
    id,
    title,
    city,
    state,
    address,
    type,
    rating,
    reviews,
    hotel_name,
    avg_rating,
    total_reviews,
    price_per_night,
    price,
    capacity,
    beds,
    baths,
    host,
    images,
    description,
    amenities: Array.isArray(amenities) ? amenities : [],
    facilities,
    rooms,
    coords,
  };
}

export async function fetchRoomsForProperty(propertyId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/${propertyId}/rooms`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapRoom) : [];
  } catch (err) {
    console.error("fetchRoomsForProperty error:", err);
    return [];
  }
}

export async function fetchProperties() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const out = await Promise.all(
      data.map(async (p: any) => {
        try {
          const rooms = await fetchRoomsForProperty(String(p.id ?? p._id ?? ""));
          return mapProperty(p, rooms);
        } catch (e) {
          return mapProperty(p, []);
        }
      })
    );
    return out;
  } catch (err) {
    console.error("fetchProperties error:", err);
    return [];
  }
}

export async function fetchProperty(propertyId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/${propertyId}`);
    if (!res.ok) return properties.find((p) => p.id === propertyId) ?? null;
    const p = await res.json();
    const rooms = await fetchRoomsForProperty(propertyId);
    return mapProperty(p, rooms);
  } catch (err) {
    console.error("fetchProperty error:", err);
    return properties.find((p) => p.id === propertyId) ?? null;
  }
}

export async function fetchPublicRooms(opts?: { city?: string; limit?: number }) {
  const city = opts?.city ? String(opts.city).toLowerCase() : undefined;
  const limit = Math.min(opts?.limit ?? 8, 100);
  try {
    const qs = new URLSearchParams();
    if (city) qs.set("city", city);
    if (limit) qs.set("limit", String(limit));
    const path = `/api/v1/rooms/public`;
    const key = getCacheKey(path, qs);

    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      (async () => {
        try {
          const r = await fetch(`${API_BASE}${path}?${qs.toString()}`);
          if (r.ok) {
            const d = await r.json();
            cache.set(key, { ts: Date.now(), data: d });
          }
        } catch (e) {
          /* ignore */
        }
      })();
      const data = cached.data;
      if (!Array.isArray(data)) return [];
      return data;
    }

    const res = await fetch(`${API_BASE}${path}?${qs.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    cache.set(key, { ts: Date.now(), data });
    return data;
  } catch (err) {
    console.error("fetchPublicRooms error:", err);
    return [];
  }
}

function mapPublicRoomsToProperties(data: any[]): FrontProperty[] {
  return data.map((r: any) => {
    const roomRate = Math.round(r.price_per_night ?? 0);
    const images = Array.isArray(r.images) ? r.images : r.images ? [r.images] : [];
    const rooms = [
      {
        id: String(r.id ?? ""),
        name: r.title ?? r.hotel_name ?? "",
        occupancy: r.occupancy ?? 2,
        bed: r.bed ?? "",
        size: r.size ?? 0,
        amenities: r.amenities ?? [],
        rate: roomRate,
      },
    ];

    return {
      id: String(r.property_id ?? ""),
      title: r.title ?? r.hotel_name ?? "",
      city: r.city ?? "",
      state: r.state ?? "",
      address: r.address ?? "",
      type: normalizePropertyType(r.property_type) ?? "Hotel",
      rating: Number(r.avg_rating ?? 0) || 0,
      reviews: Number(r.total_reviews ?? 0) || 0,
      price: roomRate,
      capacity: rooms[0].occupancy ?? 1,
      beds: 1,
      baths: 1,
      host: r.hotel_name ?? "",
      images,
      description: r.description ?? "",
      amenities: r.amenities ?? [],
      facilities: [{ group: "Amenities", items: Array.isArray(r.amenities) ? r.amenities : [] }],
      rooms,
      coords: { x: 0, y: 0 },
    };
  });
}

export async function searchRooms(filters?: { city?: string; min_price?: number; max_price?: number; property_type?: string; limit?: number }) {
  try {
    const qs = new URLSearchParams();
    if (filters?.city) qs.set("city", filters.city);
    if (filters?.min_price != null) qs.set("min_price", String(filters.min_price));
    if (filters?.max_price != null) qs.set("max_price", String(filters.max_price));
    if (filters?.property_type) qs.set("property_type", filters.property_type);
    const limit = Math.min(filters?.limit ?? 12, 100);
    qs.set("limit", String(limit));

    const path = `/api/v1/rooms/search`;
    const key = getCacheKey(path, qs);

    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      (async () => {
        try {
          const r = await fetch(`${API_BASE}${path}?${qs.toString()}`);
          if (r.ok) {
            const d = await r.json();
            cache.set(key, { ts: Date.now(), data: d });
          }
        } catch (e) {
          /* ignore */
        }
      })();
      const data = cached.data;
      if (!Array.isArray(data)) return [];
      return mapPublicRoomsToProperties(data);
    }

    const res = await fetch(`${API_BASE}${path}?${qs.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    cache.set(key, { ts: Date.now(), data });

    return mapPublicRoomsToProperties(data);
  } catch (err) {
    console.error("searchRooms error:", err);
    return [];
  }
}

export async function fetchFeaturedStays(limit = 4) {
  return searchRooms({ limit });
}

export async function fetchTrendingInLagos(limit = 6) {
  const rooms = await fetchPublicRooms({ limit: 100 });
  return mapPublicRoomsToProperties(rooms)
    .filter((property) => `${property.city} ${property.state}`.toLowerCase().includes("lagos"))
    .slice(0, limit);
}

// ==========================================
// AUTHENTICATION & AXIOS CLIENT INTEGRATION
// ==========================================

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url?.startsWith("/api/v1/")) {
      config.url = config.url.replace(/^\/api\/v1/, "");
    }
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

// ==========================================
// REVIEWS & BOOKINGS API HELPERS
// ==========================================

export async function fetchPropertyReviews(propertyId: string) {
  try {
    const res = await api.get(`/reviews/property/${propertyId}`);
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  } catch (err) {
    console.error("fetchPropertyReviews error:", err);
    return [];
  }
}

export async function submitPropertyReview(payload: {
  property_id: string;
  rating: number;
  comment: string;
}) {
  const res = await api.post("/reviews/", payload);
  return res.data;
}

export type BookingReservationPayload = {
  property_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  special_requests: string;
  total_price: number;
};

export type ApiBooking = {
  id: string;
  guest_id: string;
  room_id: string;
  property_id?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  num_guests?: number;
  special_requests?: string | null;
  total_price?: number | null;
  num_nights?: number | null;
  spc_code?: string | null;
  checked_in_at?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  room_title?: string | null;
  property_name?: string | null;
};

export type BookingCreationResponse = {
  id: string | null;
  spc_code: string | null;
  status: string | null;
};

function isApiBooking(value: unknown): value is ApiBooking {
  if (!value || typeof value !== "object") return false;
  const booking = value as Record<string, unknown>;
  const optionalString = (key: string) =>
    booking[key] === undefined || booking[key] === null || typeof booking[key] === "string";
  const optionalNumber = (key: string) =>
    booking[key] === undefined || booking[key] === null || typeof booking[key] === "number";

  return (
    typeof booking.id === "string" &&
    typeof booking.guest_id === "string" &&
    typeof booking.room_id === "string" &&
    typeof booking.status === "string" &&
    typeof booking.created_at === "string" &&
    optionalString("property_id") &&
    optionalString("check_in_date") &&
    optionalString("check_out_date") &&
    optionalNumber("num_guests") &&
    optionalString("special_requests") &&
    optionalNumber("total_price") &&
    optionalNumber("num_nights") &&
    optionalString("spc_code") &&
    optionalString("checked_in_at") &&
    optionalString("updated_at") &&
    optionalString("guest_name") &&
    optionalString("guest_email") &&
    optionalString("room_title") &&
    optionalString("property_name")
  );
}

export async function createBookingReservation(
  payload: BookingReservationPayload,
): Promise<BookingCreationResponse> {
  const res = await api.post<unknown>("/bookings/", payload);
  const response =
    typeof res.data === "object" &&
    res.data !== null &&
    "data" in res.data &&
    typeof res.data.data === "object" &&
    res.data.data !== null
      ? res.data.data
      : res.data;

  const booking =
    typeof response === "object" && response !== null && !Array.isArray(response)
      ? (response as Record<string, unknown>)
      : {};
  const id = typeof booking.id === "string" && booking.id.trim() ? booking.id : null;
  const spcCode = booking.spc_code;
  const status = booking.status;

  return {
    id,
    spc_code: typeof spcCode === "string" && spcCode.trim() ? spcCode : null,
    status: typeof status === "string" ? status : null,
  };
}

export async function fetchMyBookings() {
  let res: AxiosResponse<unknown>;
  try {
    res = await api.get<unknown>("/bookings/mine");
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      [401, 403, 404].includes(error.response?.status ?? 0)
    ) {
      return [];
    }
    throw error;
  }

  if (res.data == null) {
    return [];
  }

  const data =
    Array.isArray(res.data)
      ? res.data
      : typeof res.data === "object" &&
          "data" in res.data &&
          Array.isArray(res.data.data)
        ? res.data.data
        : null;

  if (!data || !data.every(isApiBooking)) {
    throw new Error("The booking history response was not a valid booking list.");
  }
  return data;
}

export async function cancelBookingReservation(bookingId: string) {
  const res = await api.delete(`/bookings/${encodeURIComponent(bookingId)}`);
  return res.data;
}

export default api;