import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

// GET /api/mobile/engagements — list engagements relevant to the current user.
// Buyer sees their own engagements; lawyer sees engagements assigned to them.
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.role === "LAWYER" ? { lawyerId: session.id } : { buyerId: session.id };

  const engagements = await db.engagement.findMany({
    where,
    include: {
      buyer: { select: { id: true, name: true } },
      lawyer: { select: { id: true, name: true } },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          province: true,
          price: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      _count: { select: { documents: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    engagements: engagements.map((e) => ({
      id: e.id,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      buyer: e.buyer,
      lawyer: e.lawyer,
      property: {
        id: e.property.id,
        title: e.property.title,
        city: e.property.city,
        province: e.property.province,
        price: Number(e.property.price),
        imageUrl: e.property.images[0]?.url ?? null,
      },
      documentCount: e._count.documents,
    })),
  });
}
