import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { EngagementStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.nativeEnum(EngagementStatus).optional(),
  notes: z.string().max(5000).optional(),
});

async function getAuthorizedEngagement(id: string, userId: string) {
  const engagement = await db.engagement.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true, phone: true } },
      lawyer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          professionalProfile: {
            select: { lawFirm: true, ibpRollNo: true, ibpChapter: true },
          },
        },
      },
      property: {
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!engagement) return { engagement: null, authorized: false } as const;
  const authorized = engagement.buyerId === userId || engagement.lawyerId === userId;
  return { engagement, authorized } as const;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const { engagement, authorized } = await getAuthorizedEngagement(id, userId);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ engagement });
}

// PATCH — lawyer updates status / notes. Buyer can also leave notes but not change status.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const { engagement, authorized } = await getAuthorizedEngagement(id, userId);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const isLawyer = engagement.lawyerId === userId;

  // Only lawyer can change status
  if (body.status && !isLawyer) {
    return NextResponse.json(
      { error: "Only the assigned lawyer can change the engagement status." },
      { status: 403 }
    );
  }

  const updated = await db.engagement.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });

  return NextResponse.json({ engagement: updated });
}
