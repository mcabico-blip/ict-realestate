import {
  Property,
  PropertyImage,
  PropertyAmenity,
  User,
  ProfessionalProfile,
} from "@prisma/client";

export type PropertyWithDetails = Property & {
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  owner: User & { professionalProfile: ProfessionalProfile | null };
  _count?: { favorites: number; inquiries: number };
};

export type PropertyCard = Pick<
  Property,
  | "id"
  | "title"
  | "listingType"
  | "propertyType"
  | "status"
  | "price"
  | "priceUnit"
  | "city"
  | "province"
  | "bedrooms"
  | "bathrooms"
  | "floorArea"
  | "lotArea"
  | "featured"
  | "createdAt"
> & {
  images: Pick<PropertyImage, "url" | "isPrimary">[];
};

export type SearchFilters = {
  keyword?: string;
  listingType?: string;
  propertyType?: string;
  city?: string;
  province?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  petFriendly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest";
};
