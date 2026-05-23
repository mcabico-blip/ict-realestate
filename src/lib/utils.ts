import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency = "PHP") {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (num >= 1_000_000) {
    return `${currency} ${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${currency} ${num.toLocaleString("en-PH")}`;
  }
  return `${currency} ${num}`;
}

export function formatArea(area: number | null | undefined, unit = "sqm") {
  if (!area) return "N/A";
  return `${area.toLocaleString()} ${unit}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getListingTypeLabel(type: string) {
  const labels: Record<string, string> = {
    FOR_SALE: "For Sale",
    FOR_RENT: "For Rent",
    FOR_LEASE: "For Lease",
  };
  return labels[type] ?? type;
}

export function getPropertyTypeLabel(type: string) {
  const labels: Record<string, string> = {
    HOUSE: "House",
    CONDO: "Condominium",
    APARTMENT: "Apartment",
    TOWNHOUSE: "Townhouse",
    LOT: "Lot",
    COMMERCIAL: "Commercial",
    WAREHOUSE: "Warehouse",
    OFFICE: "Office",
    FARM: "Farm",
  };
  return labels[type] ?? type;
}

export const PH_REGIONS = [
  "NCR",
  "CAR",
  "Region I",
  "Region II",
  "Region III",
  "Region IV-A",
  "MIMAROPA",
  "Region V",
  "Region VI",
  "Region VII",
  "Region VIII",
  "Region IX",
  "Region X",
  "Region XI",
  "Region XII",
  "Region XIII",
  "BARMM",
];

export const POPULAR_CITIES = [
  "Makati",
  "Taguig",
  "Pasig",
  "Quezon City",
  "Manila",
  "Mandaluyong",
  "Parañaque",
  "Pasay",
  "Muntinlupa",
  "Las Piñas",
  "Cebu City",
  "Davao City",
  "Cagayan de Oro",
  "Iloilo City",
  "Bacolod",
  "Zamboanga City",
  "General Santos",
  "Antipolo",
  "Calamba",
  "Santa Rosa",
];

export const AMENITIES = [
  "Swimming Pool",
  "Gym / Fitness Center",
  "24/7 Security",
  "CCTV",
  "Parking",
  "Elevator",
  "Balcony",
  "Garden",
  "Playground",
  "Basketball Court",
  "Function Hall",
  "Clubhouse",
  "Generator",
  "Water Tank",
  "Laundry Area",
  "Smart Home",
  "Solar Panels",
  "Airconditioning",
  "Fiber Internet Ready",
  "Near School",
  "Near Hospital",
  "Near Mall",
  "Near Transport",
];
