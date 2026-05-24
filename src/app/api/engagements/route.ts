import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLawyerInPool } from "@/lib/lawyer-pool";

const createSchema = z.object({
  propertyId: z.string().min(1),
  lawyerId: z.string().min(1),
  // Optional — buyer ID. Only relevant when a BROKER/SALESPERSON initiates the
  // engagement on behalf of a buyer (must reference an inquiry's buyer on this
  // property). If omitted, defaults to the current session user (buyer self-engages).
  buyerId: z.string().min(1).optional(),
});

// POST /api/engagements — tag a lawyer to a buyer-property deal
//
// Allowed initiators:
//   - The buyer themselves (default; buyerId omitted)
//   - A broker/salesperson on behalf of a buyer who has inquired on the property
//     (must pass buyerId; must be the agent on an inquiry for that buyer+property)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  // Lawyers and admins shouldn't initiate engagements
  if (role === "LAWYER" || role === "ADMIN") {
    return NextResponse.json(
      { error: "Lawyers and admins cannot initiate an engagement." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const isBroker = role === "BROKER" || role === "SALESPERSON";
  let buyerId: string;

  if (isBroker) {
    // Broker initiates on behalf of a buyer — buyerId is required
    if (!body.buyerId) {
      return NextResponse.json(
        { error: "buyerId is required when a broker initiates an engagement." },
        { status: 400 }
      );
    }
    // Verify there's actually an inquiry from this buyer on this property,
    // where the current broker is the agent. This is the broker's claim to
    // be involved in this deal.
    const inquiry = await db.inquiry.findFirst({
      where: {
        propertyId: body.propertyId,
        buyerId: body.buyerId,
        agentId: userId,
      },
      select: { id: true },
    });
    if (!inquiry) {
      return NextResponse.json(
        {
          error:
            "You can only engage a lawyer for buyers who have inquired on a listing you manage.",
        },
        { status: 403 }
      );
    }
    buyerId = body.buyerId;
  } else {
    // Buyer (or other non-broker, non-lawyer role) self-engages
    if (body.buyerId && body.buyerId !== userId) {
      return NextResponse.json(
        { error: "You can only engage a lawyer for yourself." },
        { status: 403 }
      );
    }
    buyerId = userId;
  }

  // Validate the lawyer
  if (!(await isLawyerInPool(body.lawyerId))) {
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

  try {
    const engagement = await db.engagement.create({
      data: {
        buyerId,
        lawyerId: body.lawyerId,
        propertyId: body.propertyId,
        initiatedById: userId,
      },
      include: {
        lawyer: { select: { name: true } },
        buyer: { select: { name: true } },
        property: { select: { title: true, city: true, province: true } },
      },
    });
    return NextResponse.json({ engagement });
  } catch (e: unknown) {
    // Unique constraint failed
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "An engagement for this buyer and property already exists." },
        { status: 409 }
      );
    }
    throw e;
  }
}

// GET /api/engagements
// - If ?propertyId is passed: returns existing engagement for current buyer on
//   that property (or null). Optionally with ?buyerId for brokers checking on
//   behalf of a specific inquirer.
// - Else: returns all engagements relevant to the current user (buyer's or lawyer's)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const propertyId = req.nextUrl.searchParams.get("propertyId");
  const buyerIdParam = req.nextUrl.searchParams.get("buyerId");

  if (propertyId) {
    // Determine which buyer to look up for: query param wins, else current user
    const buyerId = buyerIdParam ?? userId;
    const engagement = await db.engagement.findUnique({
      where: { buyerId_propertyId: { buyerId, propertyId } },
      include: { lawyer: { select: { name: true } } },
    });
    return NextResponse.json({ engagement });
  }

  // List view — auto-filter by role
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
