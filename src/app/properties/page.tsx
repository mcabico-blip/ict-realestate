import { Suspense } from "react";
import { Metadata } from "next";
import { PropertyListings } from "@/components/property/property-listings";
import { PropertyFilters } from "@/components/property/property-filters";

export const metadata: Metadata = {
  title: "Properties | ICT Realtors",
  description: "Search properties for sale, rent, and lease across the Philippines.",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {sp.listing === "FOR_RENT"
            ? "Properties for Rent"
            : sp.listing === "FOR_LEASE"
            ? "Properties for Lease"
            : sp.listing === "FOR_SALE"
            ? "Properties for Sale"
            : "Properties"}
          {sp.city && ` in ${sp.city}`}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Browse verified listings across the Philippines</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-72 shrink-0">
          <PropertyFilters searchParams={sp} />
        </aside>

        <div className="flex-1">
          <Suspense fallback={<div className="text-center py-12 text-gray-400">Loading properties...</div>}>
            <PropertyListings searchParams={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
