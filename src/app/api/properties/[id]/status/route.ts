import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { PropertyStatus } from "@prisma/client";

const schema = z.object({ status: z.nativeEnum(PropertyStatus) });

async function getUser(req: NextRequest) {
  const web = await getServerSession(authOptions);
  if (web?.user) return { id: (web.user as { id: string }).id };
  const mobile = await getMobileSession(req);
  return mobile ? { id: mobile.id } : null;
}

// POST /api/properties/[id]/status — owner changes status (e.g., mark SOLD)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await db.property.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await db.property.update({
    where: { id },
    data: { status: body.status },
  });

  // If we just sold/rented, close ALL outstanding inquiries
  if (body.status === "SOLD" || body.status === "RENTED") {
    await db.inquiry.updateMany({
      where: { propertyId: id, status: { not: "CLOSED" } },
      data: { status: "CLOSED" },
    });
  }

  return NextResponse.json({ ok: true });
}
