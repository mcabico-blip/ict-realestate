import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { touchPresence } from "@/lib/presence";

const selectSchema = z.object({
  buyerId: z.string().min(1),
});

async function getUser(req: NextRequest) {
  const web = await getServerSession(authOptions);
  if (web?.user) return { id: (web.user as { id: string }).id };
  const mobile = await getMobileSession(req);
  return mobile ? { id: mobile.id } : null;
}

// POST /api/properties/[id]/select-buyer
// The seller (= property owner / their broker) picks ONE inquiring buyer to
// proceed with. This:
//   - Sets property.selectedBuyerId
//   - Sets property.status = PENDING (no longer accepting new offers)
//   - Closes all other inquiries on this property
//   - Keeps the selected buyer's inquiry OPEN (or RESPONDED)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(user.id);

  const { id } = await params;
  const property = await db.property.findUnique({
    where: { id },
    select: { id: true, ownerId: true, selectedBuyerId: true, status: true },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only the property owner can select the buyer." },
      { status: 403 }
    );
  }
  if (property.status === "SOLD" || property.status === "RENTED") {
    return NextResponse.json(
      { error: "This property is already closed." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = selectSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify the buyer has an inquiry on this property
  const inquiry = await db.inquiry.findFirst({
    where: { propertyId: id, buyerId: body.buyerId },
    select: { id: true },
  });
  if (!inquiry) {
    return NextResponse.json(
      { error: "That buyer hasn't inquired on this property." },
      { status: 400 }
    );
  }

  // Atomic transaction: set selection + close other inquiries + status PENDING
  await db.$transaction([
    db.property.update({
      where: { id },
      data: { selectedBuyerId: body.buyerId, status: "PENDING" },
    }),
    db.inquiry.updateMany({
      where: { propertyId: id, buyerId: { not: body.buyerId } },
      data: { status: "CLOSED" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

// DELETE /api/properties/[id]/select-buyer — un-select (deal fell through;
// reopen the property to new offers)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  await db.property.update({
    where: { id },
    data: { selectedBuyerId: null, status: "ACTIVE" },
  });

  return NextResponse.json({ ok: true });
}
