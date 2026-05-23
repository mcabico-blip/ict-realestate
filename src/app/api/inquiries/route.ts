import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  propertyId: z.string(),
  agentId: z.string(),
  message: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { propertyId, agentId, message } = schema.parse(body);

    const userId = (session.user as { id: string }).id;

    const inquiry = await db.inquiry.create({
      data: {
        propertyId,
        buyerId: userId,
        agentId,
        message,
      },
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: "Failed to create inquiry" }, { status: 500 });
  }
}
