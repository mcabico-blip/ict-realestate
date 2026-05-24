import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

const toggleSchema = z.object({ propertyId: z.string().min(1) });

// POST /api/mobile/favorites — toggle favorite (Bearer-auth)
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = toggleSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = await db.favorite.findFirst({
    where: { userId: session.id, propertyId: body.propertyId },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await db.favorite.create({
    data: { userId: session.id, propertyId: body.propertyId },
  });
  return NextResponse.json({ favorited: true });
}

// GET /api/mobile/favorites — list current user's saved properties (Bearer-auth)
// If ?propertyId=X is passed, returns { favorited: boolean } only.
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const propertyId = req.nextUrl.searchParams.get("propertyId");
  if (propertyId) {
    const f = await db.favorite.findFirst({
      where: { userId: session.id, propertyId },
      select: { id: true },
    });
    return NextResponse.json({ favorited: !!f });
  }

  const favorites = await db.favorite.findMany({
    where: { userId: session.id },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          listingType: true,
          propertyType: true,
          price: true,
          city: true,
          province: true,
          bedrooms: true,
          bathrooms: true,
          floorArea: true,
          featured: true,
          status: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => ({
      id: f.id,
      property: {
        id: f.property.id,
        title: f.property.title,
        listingType: f.property.listingType,
        propertyType: f.property.propertyType,
        price: Number(f.property.price),
        city: f.property.city,
        province: f.property.province,
        bedrooms: f.property.bedrooms,
        bathrooms: f.property.bathrooms,
        floorArea: f.property.floorArea,
        featured: f.property.featured,
        status: f.property.status,
        imageUrl: f.property.images[0]?.url ?? null,
      },
    })),
  });
}
