import type { Property as FrontProperty, Room as FrontRoom } from "./data";

const API_BASE = import.meta.env.VITE_API_BASE || "";

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
  const res = await fetch(`${API_BASE}/api/v1/properties/${propertyId}/rooms`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapRoom) : [];
}

export async function fetchProperties() {
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
}

export async function fetchProperty(propertyId: string) {
  const res = await fetch(`${API_BASE}/api/v1/properties/${propertyId}`);
  if (!res.ok) return null;
  const p = await res.json();
  const rooms = await fetchRoomsForProperty(propertyId);
  return mapProperty(p, rooms);
}

export async function fetchTrendingInLagos(limit = 6) {
  const res = await fetch(`${API_BASE}/api/v1/properties?city=Lagos&limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const out: FrontProperty[] = [];
  for (const p of data) {
    try {
      const rooms = await fetchRoomsForProperty(String(p.id));
      out.push(mapProperty(p, rooms));
    } catch {
      out.push(mapProperty(p, []));
    }
  }
  return out;
}

export async function fetchFeaturedStays(limit = 4) {
  const res = await fetch(`${API_BASE}/api/v1/properties/featured?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const out: FrontProperty[] = [];
  for (const p of data) {
    try {
      const rooms = await fetchRoomsForProperty(String(p.id));
      out.push(mapProperty(p, rooms));
    } catch {
      out.push(mapProperty(p, []));
    }
  }
  return out;
}
