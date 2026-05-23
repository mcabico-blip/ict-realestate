import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PropertyCard } from "@/components/property/property-card";
import { Heart, ArrowLeft } from "lucide-react";

export const metadata = { title: "Saved Properties | ICT Realtors" };

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as { id: string }).id;

  const favorites = await db.favorite.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          id: true, title: true, listingType: true, propertyType: true,
          status: true, price: true, priceUnit: true, city: true,
          province: true, bedrooms: true, bathrooms: true, floorArea: true,
          lotArea: true, featured: true, createdAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true, isPrimary: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeProperties = favorites
    .map((f) => f.property)
    .filter((p) => p.status === "ACTIVE");

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
          <p className="text-gray-500 text-sm mt-1">
            {favorites.length} saved &middot; {activeProperties.length} still active
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No saved properties yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            Click the heart icon on any listing to save it here
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((f) => (
            <PropertyCard key={f.id} property={f.property} />
          ))}
        </div>
      )}
    </div>
  );
}
