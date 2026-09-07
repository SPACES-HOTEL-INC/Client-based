import type { Property as FrontProperty, Room as FrontRoom } from "./data";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://backend-nq9s.onrender.com";

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
  return { id, name, occupancy, bed, size, amenities, rate };
}

function mapProperty(b: BackendProperty, rooms: FrontRoom[]): FrontProperty {
  const id = String(b.id ?? b._id ?? "");
  const title = b.hotel_name ?? b.name ?? "Untitled";
  const city = b.city ?? "";
  const state = b.state ?? "";
  const address = b.address ?? "";
  const typeRaw = (b.property_type ?? "hotel").toString().toLowerCase();
  const type = typeRaw.includes("short") ? "Shortlet" : typeRaw.includes("resort") ? "Resort" : typeRaw.includes("villa") ? "Villa" : typeRaw.includes("dining") ? "Dining" : "Hotel";
  const rating = Number(b.avg_rating ?? 0) || 0;
  const reviews = Number(b.total_reviews ?? 0) || 0;
  const price = rooms.length ? Math.min(...rooms.map((r) => r.rate)) : 0;
  const capacity = Math.max(1, ...(rooms.map((r) => r.occupancy || 1)));
  const beds = rooms.length;
  const baths = 1;
  const host = b.contact ?? "Host";
  const images = Array.isArray(b.images) ? b.images : b.images ? [b.images] : [];
  const description = b.description ?? "";
  const amenities = b.amenities ?? [];
  const facilities = [{ group: "Amenities", items: Array.isArray(amenities) ? amenities : [] }];
  const coords = { x: 0, y: 0 };

  return {
    id,
    title,
    city,
    state,
    address,
    type,
    rating,
    reviews,
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

    // For each property fetch rooms to compute price and rooms list
    const out: FrontProperty[] = [];
    for (const p of data) {
      try {
        const rooms = await fetchRoomsForProperty(String(p.id));
        out.push(mapProperty(p, rooms));
      } catch (e) {
        out.push(mapProperty(p, []));
      }
    }
    return out;
  } catch (err) {
    console.error("fetchProperties error:", err);
    return [];
  }
}

export async function fetchProperty(propertyId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/${propertyId}`);
    if (!res.ok) return null;
    const p = await res.json();
    const rooms = await fetchRoomsForProperty(propertyId);
    return mapProperty(p, rooms);
  } catch (err) {
    console.error("fetchProperty error:", err);
    return null;
  }
}

export async function fetchTrendingInLagos(limit = 6) {
  try {
    // use public rooms mapping for trending (mapped to property cards)
    return await fetchPublicRooms({ city: "Lagos", limit });
  } catch (err) {
    console.error("fetchTrendingInLagos error:", err);
    return [];
  }
}

export async function fetchFeaturedStays(limit = 4) {
  try {
    // Use public rooms endpoint for featured stays as well (mapped to property cards)
    return await fetchPublicRooms({ limit });
  } catch (err) {
    console.error("fetchFeaturedStays error:", err);
    return [];
  }
}

export async function fetchPublicRooms(opts?: { city?: string; limit?: number }) {
  const city = opts?.city;
  // Enforce sensible Home limit (default 8)
  const limit = Math.min(opts?.limit ?? 8, 50);
  try {
    const qs = new URLSearchParams();
    if (city) qs.set("city", city);
    if (limit) qs.set("limit", String(limit));
    const path = `/api/v1/rooms/public`;
    const key = getCacheKey(path, qs);

    // Serve cached data immediately if available
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      // refresh in background
      (async () => {
        try {
          const r = await fetch(`${API_BASE}${path}?${qs.toString()}`);
          if (r.ok) {
            const d = await r.json();
            cache.set(key, { ts: Date.now(), data: d });
          }
        } catch (e) {
          /* ignore background fetch errors */
        }
      })();
      const data = cached.data;
      console.log("API Room Data (cache):", data);
      if (!Array.isArray(data)) return [];
      return mapPublicRoomsToProperties(data);
    }

    const res = await fetch(`${API_BASE}${path}?${qs.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    console.log("API Room Data (fetch):", data);
    cache.set(key, { ts: Date.now(), data });
    return mapPublicRoomsToProperties(data);
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
      // Prefer room title for display
      title: r.title ?? r.hotel_name ?? "",
      city: r.city ?? "",
      state: r.state ?? "",
      address: r.address ?? "",
      type: r.property_type ? r.property_type.toString() : "Hotel",
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
    // Enforce per-page limit for search (default 12)
    const limit = Math.min(filters?.limit ?? 12, 100);
    qs.set("limit", String(limit));

    const path = `/api/v1/rooms/search`;
    const key = getCacheKey(path, qs);

    // Serve cached results immediately if fresh (stale-while-revalidate)
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      // background refresh
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
      console.log("API Room Data (cache):", data);
      if (!Array.isArray(data)) return [];
      return mapPublicRoomsToProperties(data);
    }

    const res = await fetch(`${API_BASE}${path}?${qs.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    console.log("API Room Data (fetch):", data);
    cache.set(key, { ts: Date.now(), data });

    return mapPublicRoomsToProperties(data);
  } catch (err) {
    console.error("searchRooms error:", err);
    return [];
  }
}

// Replace featured/trending to use public rooms (rooms mapped to property-like cards)
export async function fetchFeaturedStays(limit = 4) {
  try {
    return await fetchPublicRooms({ limit });
  } catch (err) {
    console.error("fetchFeaturedStays error:", err);
    return [];
  }
}

export async function fetchTrendingInLagos(limit = 6) {
  try {
    return await fetchPublicRooms({ city: "Lagos", limit });
  } catch (err) {
    console.error("fetchTrendingInLagos error:", err);
    return [];
  }
}
