import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  professionalId: z.string(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { professionalId, subject, message } = schema.parse(body);
    const clientId = (session.user as { id: string }).id;

    const consultation = await db.legalConsultation.create({
      data: { clientId, lawyerId: professionalId, subject, message },
    });

    return NextResponse.json({ consultation }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
