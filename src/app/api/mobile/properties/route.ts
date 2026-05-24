import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// GET /api/mobile/properties — public list endpoint for the mobile app.
// Supports basic filtering: listing (FOR_SALE/FOR_RENT/FOR_LEASE), type, city,
// keyword (q), bedrooms, minPrice/maxPrice, sortBy.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };

  const listing = sp.get("listing");
  if (listing) where.listingType = listing as Prisma.PropertyWhereInput["listingType"];

  const type = sp.get("type");
  if (type) where.propertyType = type as Prisma.PropertyWhereInput["propertyType"];

  const city = sp.get("city");
  if (city) where.city = { contains: city, mode: "insensitive" };

  const q = sp.get("q");
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const bedrooms = sp.get("bedrooms");
  if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms, 10) };

  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const sortBy = sp.get("sortBy") ?? "newest";
  let orderBy: Prisma.PropertyOrderByWithRelationInput;
  switch (sortBy) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const properties = await db.property.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: [{ featured: "desc" }, orderBy],
    take: 100,
  });

  return NextResponse.json({
    properties: properties.map((p) => ({
      id: p.id,
      title: p.title,
      listingType: p.listingType,
      propertyType: p.propertyType,
      price: Number(p.price),
      city: p.city,
      province: p.province,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      floorArea: p.floorArea,
      featured: p.featured,
      imageUrl: p.images[0]?.url ?? null,
    })),
  });
}
