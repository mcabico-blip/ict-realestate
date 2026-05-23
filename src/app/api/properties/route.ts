import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  listingType: z.enum(["FOR_SALE", "FOR_RENT", "FOR_LEASE"]),
  propertyType: z.enum(["HOUSE", "CONDO", "APARTMENT", "TOWNHOUSE", "LOT", "COMMERCIAL", "WAREHOUSE", "OFFICE", "FARM"]),
  price: z.number().positive(),
  negotiable: z.boolean().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  municipality: z.string().optional().nullable(),
  province: z.string().min(2),
  region: z.string().min(2),
  zipCode: z.string().optional().nullable(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  floorArea: z.number().positive().optional().nullable(),
  lotArea: z.number().positive().optional().nullable(),
  parkingSpaces: z.number().int().min(0).optional().nullable(),
  floors: z.number().int().min(1).optional().nullable(),
  yearBuilt: z.number().int().optional().nullable(),
  furnished: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const keyword = searchParams.get("keyword") ?? "";
  const listingType = searchParams.get("listing");
  const propertyType = searchParams.get("type");
  const city = searchParams.get("city");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const bedrooms = searchParams.get("bedrooms");
  const furnished = searchParams.get("furnished");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "12"));
  const sortBy = searchParams.get("sortBy") ?? "newest";

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
    sortBy === "price_asc" ? { price: "asc" }
      : sortBy === "price_desc" ? { price: "desc" }
      : sortBy === "oldest" ? { createdAt: "asc" }
      : { createdAt: "desc" };

  const [total, properties] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      orderBy: [{ featured: "desc" }, orderBy],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, listingType: true, propertyType: true,
        status: true, price: true, priceUnit: true, city: true,
        province: true, bedrooms: true, bathrooms: true, floorArea: true,
        lotArea: true, featured: true, createdAt: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true, isPrimary: true } },
      },
    }),
  ]);

  return NextResponse.json({ properties, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const userId = (session.user as { id: string }).id;

    const { amenities, ...propertyData } = data;

    const property = await db.property.create({
      data: {
        ...propertyData,
        ownerId: userId,
        amenities: amenities?.length
          ? { createMany: { data: amenities.map((name) => ({ name })) } }
          : undefined,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
