import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { EngagementStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.nativeEnum(EngagementStatus).optional(),
  notes: z.string().max(5000).optional(),
});

// GET /api/mobile/engagements/[id] — full engagement detail (auth)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

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
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          province: true,
          price: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          owner: { select: { name: true, phone: true, email: true } },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (engagement.buyerId !== session.id && engagement.lawyerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    engagement: {
      id: engagement.id,
      status: engagement.status,
      notes: engagement.notes,
      createdAt: engagement.createdAt.toISOString(),
      updatedAt: engagement.updatedAt.toISOString(),
      buyer: engagement.buyer,
      lawyer: {
        ...engagement.lawyer,
        lawFirm: engagement.lawyer.professionalProfile?.lawFirm ?? null,
        ibpRollNo: engagement.lawyer.professionalProfile?.ibpRollNo ?? null,
        ibpChapter: engagement.lawyer.professionalProfile?.ibpChapter ?? null,
      },
      property: {
        id: engagement.property.id,
        title: engagement.property.title,
        address: engagement.property.address,
        city: engagement.property.city,
        province: engagement.property.province,
        price: Number(engagement.property.price),
        imageUrl: engagement.property.images[0]?.url ?? null,
        owner: engagement.property.owner,
      },
      documents: engagement.documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        notes: d.notes,
        uploadedBy: d.uploadedBy,
        createdAt: d.createdAt.toISOString(),
      })),
      // Who can do what — saves the mobile client from repeating role logic
      capabilities: {
        canUpload: true,
        canChangeStatus: engagement.lawyerId === session.id,
        canDeleteOwnDocs: true,
      },
    },
  });
}

// PATCH /api/mobile/engagements/[id] — update status (lawyer only) or notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const engagement = await db.engagement.findUnique({
    where: { id },
    select: { buyerId: true, lawyerId: true },
  });
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (engagement.buyerId !== session.id && engagement.lawyerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.status && engagement.lawyerId !== session.id) {
    return NextResponse.json(
      { error: "Only the assigned lawyer can change the status." },
      { status: 403 }
    );
  }

  await db.engagement.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
