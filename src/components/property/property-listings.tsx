import { db } from "@/lib/db";
import { PropertyCard } from "@/components/property/property-card";
import { Prisma } from "@prisma/client";

interface PropertyListingsProps {
  searchParams: Record<string, string | undefined>;
}

export async function PropertyListings({ searchParams }: PropertyListingsProps) {
  const keyword = searchParams.keyword ?? "";
  const listingType = searchParams.listing;
  const propertyType = searchParams.type;
  const city = searchParams.city;
  const minPrice = searchParams.minPrice;
  const maxPrice = searchParams.maxPrice;
  const bedrooms = searchParams.bedrooms;
  const furnished = searchParams.furnished;
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 12;
  const sortBy = searchParams.sortBy ?? "newest";

  const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { city: { contains: keyword, mode: "insensitive" } },
      { province: { contains: keyword, mode: "insensitive" } },
      { address: { contains: keyword, mode: "insensitive" } },
    ];
  }
  if (listingType) where.listingType = listingType as Prisma.EnumListingTypeFilter;
  if (propertyType) where.propertyType = propertyType as Prisma.EnumPropertyTypeFilter;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = new Prisma.Decimal(minPrice);
    if (maxPrice) where.price.lte = new Prisma.Decimal(maxPrice);
  }
  if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
  if (furnished === "true") where.furnished = true;

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sortBy === "price_asc"
      ? { price: "asc" }
      : sortBy === "price_desc"
      ? { price: "desc" }
      : sortBy === "oldest"
      ? { createdAt: "asc" }
      : { createdAt: "desc" };

  let total = 0;
  let properties: Awaited<ReturnType<typeof db.property.findMany<{ select: { id: true; title: true; listingType: true; propertyType: true; status: true; price: true; priceUnit: true; city: true; province: true; bedrooms: true; bathrooms: true; floorArea: true; lotArea: true; featured: true; createdAt: true; images: { where: { isPrimary: true }; take: 1; select: { url: true; isPrimary: true } } } }>>> = [];

  try {
  [total, properties] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: [{ featured: "desc" }, orderBy],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        listingType: true,
        propertyType: true,
        status: true,
        price: true,
        priceUnit: true,
        city: true,
        province: true,
        bedrooms: true,
        bathrooms: true,
        floorArea: true,
        lotArea: true,
        featured: true,
        createdAt: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, isPrimary: true },
        },
      },
    }),
  ]);
  } catch {
    // DB not yet migrated or unavailable
  }

  const totalPages = Math.ceil(total / limit);

  if (properties.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
        <p className="text-4xl mb-3">🏠</p>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
        <p className="text-gray-400 text-sm">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> properties found
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${new URLSearchParams({ ...searchParams, page: String(p) }).toString()}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-red-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
