import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  status: z.enum(["OPEN", "RESPONDED", "CLOSED"]),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { status } = schema.parse(body);

    // Verify this inquiry belongs to the agent
    const inquiry = await db.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.agentId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.inquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
