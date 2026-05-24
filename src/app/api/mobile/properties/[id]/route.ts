import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/mobile/properties/[id] — property detail for the mobile app.
// Public; no auth needed for browsing.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const property = await db.property.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      amenities: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          professionalProfile: {
            select: { agency: true, licenseNo: true },
          },
        },
      },
      _count: { select: { favorites: true, inquiries: true } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment view count (fire-and-forget; don't await user response on this)
  db.property
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return NextResponse.json({
    property: {
      id: property.id,
      title: property.title,
      description: property.description,
      listingType: property.listingType,
      propertyType: property.propertyType,
      price: Number(property.price),
      negotiable: property.negotiable,
      address: property.address,
      city: property.city,
      province: property.province,
      region: property.region,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      floorArea: property.floorArea,
      lotArea: property.lotArea,
      parkingSpaces: property.parkingSpaces,
      yearBuilt: property.yearBuilt,
      furnished: property.furnished,
      petFriendly: property.petFriendly,
      featured: property.featured,
      viewCount: property.viewCount,
      favoritesCount: property._count.favorites,
      inquiriesCount: property._count.inquiries,
      createdAt: property.createdAt.toISOString(),
      images: property.images.map((i) => ({ url: i.url, isPrimary: i.isPrimary })),
      amenities: property.amenities.map((a) => a.name),
      owner: {
        id: property.owner.id,
        name: property.owner.name,
        email: property.owner.email,
        phone: property.owner.phone,
        role: property.owner.role,
        agency: property.owner.professionalProfile?.agency ?? null,
        licenseNo: property.owner.professionalProfile?.licenseNo ?? null,
      },
    },
  });
}
