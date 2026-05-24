import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/mobile/login — email + password → { token, user }
// The token is a HS256 JWT signed with NEXTAUTH_SECRET. The Flutter app stores
// it in secure storage and sends it as `Authorization: Bearer <token>` on
// subsequent requests.
export async function POST(req: NextRequest) {
  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: body.email },
    select: { id: true, email: true, name: true, password: true, role: true },
  });
  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(body.password, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signMobileToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
