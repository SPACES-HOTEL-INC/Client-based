import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

export type PropertyType = "Hotel" | "Shortlet" | "Villa" | "Resort" | "Event Space" | "Dining";

export type Room = {
  id: string;
  name: string;
  occupancy: number;
  bed: string;
  size: number;
  amenities: string[];
  rate: number; // NGN per night
};

export type Property = {
  id: string;
  title: string;
  city: string;
  state: string;
  address: string;
  type: PropertyType;
  rating: number;
  reviews: number;
  price: number; // NGN from-price per night
  capacity: number;
  beds: number;
  baths: number;
  host: string;
  images: string[];
  description: string;
  amenities: string[];
  facilities: { group: string; items: string[] }[];
  rooms: Room[];
  coords: { x: number; y: number };
};

const baseFacilities = (extra: string[] = []) => [
  { group: "Bathroom", items: ["Rain shower", "Hot water", "Complimentary toiletries", "Bathrobes"] },
  { group: "Media & Tech", items: ["Smart TV", "Fibre Wi-Fi", "Bluetooth speaker", "Fast charging points"] },
  { group: "Room Amenities", items: ["Air conditioning", "Workspace desk", "Blackout curtains", "Daily housekeeping", ...extra] },
  { group: "Food & Drink", items: ["Breakfast available", "In-room dining", "Mini bar", "Coffee machine"] },
];

export const properties: Property[] = [
  {
    id: "banana-island-waterfront",
    title: "Banana Island Waterfront Suite",
    city: "Ikoyi",
    state: "Lagos",
    address: "12 Ocean Parade, Banana Island, Ikoyi, Lagos",
    type: "Villa",
    rating: 4.9,
    reviews: 214,
    price: 205000,
    capacity: 4,
    beds: 2,
    baths: 2,
    host: "Adaeze Luxe Homes",
    images: [p1, p2, p5],
    description:
      "A serene waterfront residence with panoramic lagoon views, private terrace lounge and concierge service on call around the clock. Designed for slow mornings and long, golden evenings.",
    amenities: ["Wi-Fi", "Pool", "Gym", "Breakfast", "Parking", "Air conditioning"],
    facilities: baseFacilities(["Private terrace"]),
    rooms: [
      { id: "r1", name: "Executive Waterfront Suite", occupancy: 3, bed: "1 King bed", size: 62, amenities: ["Lagoon view", "Kitchenette", "Workspace"], rate: 205000 },
      { id: "r2", name: "Deluxe Garden Room", occupancy: 2, bed: "1 Queen bed", size: 38, amenities: ["Garden view", "Smart TV"], rate: 148000 },
    ],
    coords: { x: 34, y: 58 },
  },
  {
    id: "skyline-penthouse-vi",
    title: "Skyline Penthouse, Victoria Island",
    city: "Victoria Island",
    state: "Lagos",
    address: "1 Ahmadu Bello Way, Victoria Island, Lagos",
    type: "Shortlet",
    rating: 4.8,
    reviews: 168,
    price: 320000,
    capacity: 6,
    beds: 3,
    baths: 3,
    host: "Skyline Residences NG",
    images: [p2, p1, p6],
    description:
      "Floor-to-ceiling glass, a wraparound skyline and a chef-ready kitchen. The penthouse sits on the 24th floor with private lift access and dedicated parking.",
    amenities: ["Wi-Fi", "Gym", "Parking", "Air conditioning", "Pool"],
    facilities: baseFacilities(["Private lift access"]),
    rooms: [
      { id: "r1", name: "Penthouse Full Floor", occupancy: 6, bed: "3 King beds", size: 210, amenities: ["Skyline view", "Chef kitchen", "Cinema room"], rate: 320000 },
      { id: "r2", name: "Skyline Studio", occupancy: 2, bed: "1 King bed", size: 45, amenities: ["City view", "Kitchenette"], rate: 175000 },
    ],
    coords: { x: 58, y: 40 },
  },
  {
    id: "grand-ballroom-ikeja",
    title: "The Grand Ballroom, Ikeja GRA",
    city: "Ikeja GRA",
    state: "Lagos",
    address: "7 Isaac John Street, Ikeja GRA, Lagos",
    type: "Event Space",
    rating: 4.7,
    reviews: 92,
    price: 950000,
    capacity: 600,
    beds: 0,
    baths: 6,
    host: "GRA Events Collective",
    images: [p3, p4, p1],
    description:
      "A 600-guest ballroom with crystal chandeliers, in-house sound, staging and a dedicated events manager. Catering partners available on request.",
    amenities: ["Wi-Fi", "Parking", "Air conditioning", "Breakfast"],
    facilities: baseFacilities(["Stage & lighting rig"]),
    rooms: [
      { id: "r1", name: "Full Ballroom Hire", occupancy: 600, bed: "Banquet layout", size: 900, amenities: ["Stage", "Sound system", "Valet parking"], rate: 950000 },
      { id: "r2", name: "Private Wing", occupancy: 180, bed: "Cocktail layout", size: 260, amenities: ["Bar", "Lounge seating"], rate: 380000 },
    ],
    coords: { x: 46, y: 22 },
  },
  {
    id: "nkoyo-fine-dining",
    title: "Nkoyo Fine-Dining Experience",
    city: "Victoria Island",
    state: "Lagos",
    address: "23 Musa Yar'Adua Street, Victoria Island, Lagos",
    type: "Dining",
    rating: 4.9,
    reviews: 340,
    price: 45000,
    capacity: 8,
    beds: 0,
    baths: 2,
    host: "Nkoyo Hospitality",
    images: [p4, p3, p2],
    description:
      "A seven-course tasting menu rooted in West African produce, served in a candlelit dining room. Wine pairing optional, reservations essential.",
    amenities: ["Wi-Fi", "Parking", "Air conditioning"],
    facilities: baseFacilities(["Private dining nook"]),
    rooms: [
      { id: "r1", name: "Chef's Table (per guest)", occupancy: 8, bed: "Counter seating", size: 20, amenities: ["7 courses", "Wine pairing"], rate: 45000 },
      { id: "r2", name: "Private Dining Room", occupancy: 12, bed: "Private room", size: 40, amenities: ["Dedicated server", "Set menu"], rate: 260000 },
    ],
    coords: { x: 62, y: 55 },
  },
  {
    id: "lekki-loft-chevron",
    title: "The Lekki Loft — Chevron",
    city: "Lekki",
    state: "Lagos",
    address: "9 Chevron Drive, Lekki Phase 1, Lagos",
    type: "Shortlet",
    rating: 4.6,
    reviews: 121,
    price: 96000,
    capacity: 4,
    beds: 2,
    baths: 2,
    host: "Chevron Loft Studios",
    images: [p5, p1, p6],
    description:
      "A light-filled duplex loft with a mezzanine bedroom, indoor greenery and a quiet workspace. Perfect for a work trip that doesn't feel like one.",
    amenities: ["Wi-Fi", "Breakfast", "Parking", "Air conditioning", "Gym"],
    facilities: baseFacilities(["Mezzanine study"]),
    rooms: [
      { id: "r1", name: "Entire Loft", occupancy: 4, bed: "1 King + 1 Sofa bed", size: 88, amenities: ["Full kitchen", "Washer", "Workspace"], rate: 96000 },
      { id: "r2", name: "Mezzanine Room", occupancy: 2, bed: "1 Queen bed", size: 30, amenities: ["Ensuite", "Desk"], rate: 62000 },
    ],
    coords: { x: 72, y: 66 },
  },
  {
    id: "obudu-cliff-chalet",
    title: "Obudu Cliff Resort Chalet",
    city: "Obudu Mountain Resort",
    state: "Cross River",
    address: "Obudu Mountain Resort, Obanliku, Cross River",
    type: "Resort",
    rating: 4.8,
    reviews: 187,
    price: 132000,
    capacity: 5,
    beds: 2,
    baths: 2,
    host: "Obudu Ridge Retreats",
    images: [p6, p5, p3],
    description:
      "A timber chalet perched on the ridge, waking up above the clouds. Guided hikes, cable car access and a fireplace for cold mountain nights.",
    amenities: ["Wi-Fi", "Pool", "Breakfast", "Parking", "Gym"],
    facilities: baseFacilities(["Fireplace", "Mountain terrace"]),
    rooms: [
      { id: "r1", name: "Ridge Chalet", occupancy: 5, bed: "2 Queen beds", size: 110, amenities: ["Fireplace", "Terrace", "Valley view"], rate: 132000 },
      { id: "r2", name: "Cliff Deluxe Room", occupancy: 2, bed: "1 King bed", size: 42, amenities: ["Balcony", "Heater"], rate: 88000 },
    ],
    coords: { x: 24, y: 34 },
  },
];

export const AMENITIES = ["Wi-Fi", "Pool", "Gym", "Breakfast", "Parking", "Air conditioning"];
export const PROPERTY_TYPES: PropertyType[] = ["Hotel", "Shortlet", "Villa", "Resort", "Event Space", "Dining"];

export const getProperty = (id: string) => properties.find((p) => p.id === id);
