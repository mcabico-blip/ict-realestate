import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

const schema = z.object({
  propertyId: z.string().min(1),
  message: z.string().min(5).max(2000),
});

// POST /api/mobile/inquiries — buyer sends inquiry to a property's owner
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const property = await db.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true, ownerId: true },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.ownerId === session.id) {
    return NextResponse.json({ error: "You can't inquire on your own listing." }, { status: 400 });
  }

  const inquiry = await db.inquiry.create({
    data: {
      propertyId: property.id,
      buyerId: session.id,
      agentId: property.ownerId,
      message: body.message,
    },
  });

  return NextResponse.json({ inquiry: { id: inquiry.id, status: inquiry.status } });
}
