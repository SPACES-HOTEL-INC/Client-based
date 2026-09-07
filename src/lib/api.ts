import type { Property as FrontProperty, Room as FrontRoom } from "./data";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://backend-nq9s.onrender.com";

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
    const res = await fetch(`${API_BASE}/api/v1/properties?city=Lagos&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
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
    console.error("fetchTrendingInLagos error:", err);
    return [];
  }
}

export async function fetchFeaturedStays(limit = 4) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/featured?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
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
    console.error("fetchFeaturedStays error:", err);
    return [];
  }
}

export async function fetchPublicRooms(opts?: { city?: string; limit?: number }) {
  const city = opts?.city;
  const limit = opts?.limit ?? 6;
  try {
    const qs = new URLSearchParams();
    if (city) qs.set("city", city);
    if (limit) qs.set("limit", String(limit));
    const res = await fetch(`${API_BASE}/api/v1/rooms/public?${qs.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Map each room + parent property metadata into a FrontProperty-shaped object
    const out: FrontProperty[] = data.map((r: any) => {
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
        title: r.hotel_name ?? r.title ?? "",
        city: r.city ?? "",
        state: r.state ?? "",
        address: r.address ?? "",
        type: "Hotel",
        rating: Number(r.avg_rating ?? 0) || 0,
        reviews: 0,
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

    return out;
  } catch (err) {
    console.error("fetchPublicRooms error:", err);
    return [];
  }
}

export async function searchRooms(filters?: { city?: string; min_price?: number; max_price?: number; property_type?: string; limit?: number }) {
  try {
    const qs = new URLSearchParams();
    if (filters?.city) qs.set("city", filters.city);
    if (filters?.min_price != null) qs.set("min_price", String(filters.min_price));
    if (filters?.max_price != null) qs.set("max_price", String(filters.max_price));
    if (filters?.property_type) qs.set("property_type", filters.property_type);
    qs.set("limit", String(filters?.limit ?? 20));

    const res = await fetch(`${API_BASE}/api/v1/rooms/search?${qs.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Map room+property metadata into FrontProperty shape (single-room per property card)
    const out: FrontProperty[] = data.map((r: any) => {
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
        title: r.hotel_name ?? r.title ?? "",
        city: r.city ?? "",
        state: r.state ?? "",
        address: r.address ?? "",
        type: (r.property_type ?? "hotel").toString(),
        rating: Number(r.avg_rating ?? 0) || 0,
        reviews: 0,
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

    return out;
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
