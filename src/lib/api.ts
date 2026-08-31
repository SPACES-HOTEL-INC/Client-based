import type { Property, Room } from "./data";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

async function safeJson(res: Response) {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return res.json();
}

function mapRoom(r: any): Room {
  return {
    id: String(r.id ?? r.slug ?? r.room_id ?? ""),
    name: r.name ?? r.title ?? "Room",
    occupancy: Number(r.occupancy ?? r.max_guests ?? 1),
    bed: r.bed ?? r.bed_type ?? "",
    size: Number(r.size ?? r.area ?? 0),
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    rate: Number(r.rate ?? r.price ?? 0),
  };
}

function mapProperty(p: any): Property {
  return {
    id: String(p.id ?? p.slug ?? p.property_id ?? ""),
    title: p.title ?? p.name ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    address: p.address ?? "",
    type: (p.type ?? p.property_type ?? "Shortlet") as Property["type"],
    rating: Number(p.rating ?? 0),
    reviews: Number(p.reviews ?? p.review_count ?? 0),
    price: Number(p.price ?? p.from_price ?? 0),
    capacity: Number(p.capacity ?? p.max_guests ?? 0),
    beds: Number(p.beds ?? p.bed_count ?? 0),
    baths: Number(p.baths ?? p.bath_count ?? 0),
    host: p.host ?? p.owner ?? "",
    images: Array.isArray(p.images) ? p.images : [],
    description: p.description ?? "",
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    facilities: Array.isArray(p.facilities) ? p.facilities : [],
    rooms: Array.isArray(p.rooms) ? p.rooms.map(mapRoom) : [],
    coords: { x: Number(p.coords?.x ?? p.x ?? 50), y: Number(p.coords?.y ?? p.y ?? 50) },
  };
}

export async function fetchProperties(): Promise<Property[]> {
  const res = await fetch(`${API_BASE}/properties`);
  const data = await safeJson(res);
  if (!Array.isArray(data)) return [];
  return data.map(mapProperty);
}

export async function fetchProperty(id: string): Promise<Property | null> {
  const res = await fetch(`${API_BASE}/properties/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  const data = await safeJson(res);
  return mapProperty(data);
}

export { API_BASE };
