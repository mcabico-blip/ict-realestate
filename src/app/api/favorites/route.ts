import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ propertyId: z.string() });

// POST: toggle favorite (add if missing, remove if present)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { propertyId } = schema.parse(await req.json());

    const existing = await db.favorite.findFirst({ where: { userId, propertyId } });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    } else {
      await db.favorite.create({ data: { userId, propertyId } });
      return NextResponse.json({ favorited: true });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: "Failed to update favorite" }, { status: 500 });
  }
}

// GET: check if a property is favorited (optional: pass ?propertyId=xxx)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ favorited: false });
  }

  const userId = (session.user as { id: string }).id;
  const propertyId = req.nextUrl.searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const existing = await db.favorite.findFirst({ where: { userId, propertyId } });
  return NextResponse.json({ favorited: !!existing });
}
