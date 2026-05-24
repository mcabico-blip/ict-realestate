import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  propertyId: z.string().min(1),
  lawyerId: z.string().min(1),
});

// POST /api/engagements — buyer engages a lawyer on a property
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  // Only buyers (or sellers) can engage a lawyer. Brokers/lawyers/admins shouldn't.
  if (role === "BROKER" || role === "SALESPERSON" || role === "LAWYER" || role === "ADMIN") {
    return NextResponse.json(
      { error: "Only buyers can engage a lawyer for a property purchase." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify the lawyer is actually a LAWYER role user
  const lawyer = await db.user.findUnique({
    where: { id: body.lawyerId },
    select: { id: true, role: true },
  });
  if (!lawyer || lawyer.role !== "LAWYER") {
    return NextResponse.json({ error: "Selected user is not a lawyer." }, { status: 400 });
  }

  // Verify the property exists
  const property = await db.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  // Upsert (uniqueness on [buyerId, propertyId] prevents duplicates)
  try {
    const engagement = await db.engagement.create({
      data: {
        buyerId: userId,
        lawyerId: body.lawyerId,
        propertyId: body.propertyId,
      },
      include: {
        lawyer: { select: { name: true } },
        property: { select: { title: true, city: true, province: true } },
      },
    });
    return NextResponse.json({ engagement });
  } catch (e: unknown) {
    // Unique constraint failed
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "You already have an engagement for this property." },
        { status: 409 }
      );
    }
    throw e;
  }
}

// GET /api/engagements
// - If ?propertyId is passed: returns existing engagement for current buyer on that property (or null)
// - Else: returns all engagements relevant to the current user (buyer's or lawyer's)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const propertyId = req.nextUrl.searchParams.get("propertyId");
  if (propertyId) {
    const engagement = await db.engagement.findUnique({
      where: { buyerId_propertyId: { buyerId: userId, propertyId } },
      include: { lawyer: { select: { name: true } } },
    });
    return NextResponse.json({ engagement });
  }

  // List view
  const engagements = await db.engagement.findMany({
    where:
      role === "LAWYER"
        ? { lawyerId: userId }
        : { buyerId: userId },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
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

  return NextResponse.json({ engagements });
}
