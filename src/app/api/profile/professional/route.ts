import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfessionalType } from "@prisma/client";

const baseSchema = z.object({
  bio: z.string().max(2000).optional().nullable(),
  yearsExp: z.coerce.number().int().min(0).max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  province: z.string().max(80).optional().nullable(),
  // Broker / Salesperson
  licenseNo: z.string().max(50).optional().nullable(),
  prcIdNo: z.string().max(50).optional().nullable(),
  accreditationNo: z.string().max(50).optional().nullable(),
  supervisingBroker: z.string().max(120).optional().nullable(),
  realtorBoard: z.string().max(120).optional().nullable(),
  agency: z.string().max(200).optional().nullable(),
  specialties: z.array(z.string().max(60)).max(20).optional(),
  // Lawyer
  ibpRollNo: z.string().max(50).optional().nullable(),
  ibpChapter: z.string().max(120).optional().nullable(),
  lawFirm: z.string().max(200).optional().nullable(),
  barYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  lawSpecialties: z.array(z.string().max(60)).max(20).optional(),
});

// GET — current user's professional profile (or null if none)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const profile = await db.professionalProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

// PUT — upsert the current user's professional profile. ProfessionalType is
// derived from User.role (BROKER/SALESPERSON/LAWYER).
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  if (role !== "BROKER" && role !== "SALESPERSON" && role !== "LAWYER") {
    return NextResponse.json(
      { error: "Only brokers, salespersons, and lawyers have a professional profile." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = baseSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const profType = role as ProfessionalType;

  const profile = await db.professionalProfile.upsert({
    where: { userId },
    create: {
      userId,
      professionalType: profType,
      bio: body.bio ?? null,
      yearsExp: body.yearsExp ?? null,
      city: body.city ?? null,
      province: body.province ?? null,
      licenseNo: body.licenseNo ?? null,
      prcIdNo: body.prcIdNo ?? null,
      accreditationNo: body.accreditationNo ?? null,
      supervisingBroker: body.supervisingBroker ?? null,
      realtorBoard: body.realtorBoard ?? null,
      agency: body.agency ?? null,
      specialties: body.specialties ?? [],
      ibpRollNo: body.ibpRollNo ?? null,
      ibpChapter: body.ibpChapter ?? null,
      lawFirm: body.lawFirm ?? null,
      barYear: body.barYear ?? null,
      lawSpecialties: body.lawSpecialties ?? [],
    },
    update: {
      bio: body.bio ?? null,
      yearsExp: body.yearsExp ?? null,
      city: body.city ?? null,
      province: body.province ?? null,
      licenseNo: body.licenseNo ?? null,
      prcIdNo: body.prcIdNo ?? null,
      accreditationNo: body.accreditationNo ?? null,
      supervisingBroker: body.supervisingBroker ?? null,
      realtorBoard: body.realtorBoard ?? null,
      agency: body.agency ?? null,
      specialties: body.specialties ?? [],
      ibpRollNo: body.ibpRollNo ?? null,
      ibpChapter: body.ibpChapter ?? null,
      lawFirm: body.lawFirm ?? null,
      barYear: body.barYear ?? null,
      lawSpecialties: body.lawSpecialties ?? [],
    },
  });

  return NextResponse.json({ profile });
}
