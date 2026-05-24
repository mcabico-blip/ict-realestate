import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Returns the list of lawyers available for engagement.
// Auth required — this is NOT a public directory; it's the picker shown to a buyer
// during the engagement flow on a property page.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lawyers = await db.user.findMany({
    where: {
      role: "LAWYER",
      professionalProfile: { professionalType: "LAWYER" },
    },
    select: {
      id: true,
      name: true,
      professionalProfile: {
        select: {
          lawFirm: true,
          ibpRollNo: true,
          ibpChapter: true,
          barYear: true,
          city: true,
          yearsExp: true,
          lawSpecialties: true,
          verified: true,
          featured: true,
        },
      },
    },
    orderBy: [
      { professionalProfile: { featured: "desc" } },
      { professionalProfile: { verified: "desc" } },
      { name: "asc" },
    ],
  });

  return NextResponse.json({ lawyers });
}
