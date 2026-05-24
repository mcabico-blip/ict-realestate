import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { ListingType, PropertyType } from "@prisma/client";

const schema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  listingType: z.nativeEnum(ListingType),
  propertyType: z.nativeEnum(PropertyType),
  price: z.number().positive(),
  negotiable: z.boolean().optional().default(false),
  address: z.string().min(3).max(300),
  city: z.string().min(2).max(80),
  province: z.string().min(2).max(80),
  region: z.string().min(1).max(20),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(50).optional().nullable(),
  floorArea: z.number().positive().optional().nullable(),
  lotArea: z.number().positive().optional().nullable(),
  parkingSpaces: z.number().int().min(0).max(50).optional().nullable(),
  furnished: z.boolean().optional().default(false),
  petFriendly: z.boolean().optional().default(false),
  amenities: z.array(z.string().max(100)).max(30).optional().default([]),
});

// POST /api/mobile/listings — create a new property listing (Bearer auth)
// Mobile-friendly: takes everything in a single JSON payload, no images for V1
// (the user can add images later via the web).
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request body" },
      { status: 400 }
    );
  }

  const property = await db.property.create({
    data: {
      title: body.title,
      description: body.description,
      listingType: body.listingType,
      propertyType: body.propertyType,
      price: body.price,
      negotiable: body.negotiable,
      address: body.address,
      city: body.city,
      province: body.province,
      region: body.region,
      bedrooms: body.bedrooms ?? null,
      bathrooms: body.bathrooms ?? null,
      floorArea: body.floorArea ?? null,
      lotArea: body.lotArea ?? null,
      parkingSpaces: body.parkingSpaces ?? null,
      furnished: body.furnished,
      petFriendly: body.petFriendly,
      ownerId: session.id,
      amenities: body.amenities.length > 0
        ? { create: body.amenities.map((name) => ({ name })) }
        : undefined,
    },
  });

  return NextResponse.json({ property: { id: property.id, title: property.title } });
}
