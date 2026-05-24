/**
 * Bearer-token auth for the Flutter mobile app.
 *
 * The web client uses NextAuth cookies. Mobile clients can't easily use that
 * (cookie jars, CSRF, hostname mismatches), so we issue our own JWTs signed
 * with NEXTAUTH_SECRET via this module. API routes that need to support
 * mobile call `getMobileSession(req)` — they get back the same shape as a
 * NextAuth session but sourced from the Authorization: Bearer header.
 */

import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const ISSUER = "ict-realtors-mobile";
const AUDIENCE = "ict-realtors-mobile";
const EXPIRY = "30d";

function secret() {
  const raw = process.env.NEXTAUTH_SECRET;
  if (!raw) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export type MobileSession = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function signMobileToken(user: MobileSession): Promise<string> {
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifyMobileToken(token: string): Promise<MobileSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
      role: (payload.role as string) ?? "BUYER",
    };
  } catch {
    return null;
  }
}

/**
 * Extract and validate a mobile session from a Next.js request.
 * Returns the session payload or null. Use in mobile API routes:
 *
 *   const session = await getMobileSession(req);
 *   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function getMobileSession(req: NextRequest): Promise<MobileSession | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  return await verifyMobileToken(token);
}
