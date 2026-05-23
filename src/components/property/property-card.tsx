"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Maximize, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getListingTypeLabel, getPropertyTypeLabel } from "@/lib/utils";
import { PropertyCard as PropertyCardType } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: PropertyCardType;
  className?: string;
}

const listingColors: Record<string, string> = {
  FOR_SALE: "bg-red-600",
  FOR_RENT: "bg-blue-600",
  FOR_LEASE: "bg-purple-600",
};

export function PropertyCard({ property, className }: PropertyCardProps) {
  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];
  const imageUrl = primaryImage?.url ?? "/placeholder-property.jpg";

  return (
    <Link href={`/properties/${property.id}`}>
      <div
        className={cn(
          "group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
          className
        )}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold text-white",
                listingColors[property.listingType] ?? "bg-gray-600"
              )}
            >
              {getListingTypeLabel(property.listingType)}
            </span>
            {property.featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white">
                Featured
              </span>
            )}
          </div>
          {/* Favorite */}
          <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm">
            <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
          </button>
          {/* Property Type */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
              {getPropertyTypeLabel(property.propertyType)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <p className="text-xl font-bold text-red-600 mb-1">
            {formatPrice(Number(property.price))}
            {property.listingType !== "FOR_SALE" && (
              <span className="text-sm font-normal text-gray-500">/mo</span>
            )}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {property.city}, {property.province}
            </span>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-gray-600 border-t pt-3">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5 text-gray-400" />
                {property.bedrooms} BR
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5 text-gray-400" />
                {property.bathrooms} BA
              </span>
            )}
            {property.floorArea && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5 text-gray-400" />
                {property.floorArea} sqm
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
