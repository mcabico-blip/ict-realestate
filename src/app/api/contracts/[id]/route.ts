import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const CONTRACTS_ROOT = join(process.cwd(), "contracts");

// GET /api/contracts/[id] — stream a contract document file after auth check.
// Only the buyer and lawyer on the parent engagement may download.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const doc = await db.contractDocument.findUnique({
    where: { id },
    include: { engagement: { select: { buyerId: true, lawyerId: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.engagement.buyerId !== userId && doc.engagement.lawyerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buf = await readFile(join(CONTRACTS_ROOT, doc.fileKey));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.fileName}"`,
        "Content-Length": String(doc.fileSize),
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 410 });
  }
}

// DELETE /api/contracts/[id] — uploader OR lawyer can remove a document.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const doc = await db.contractDocument.findUnique({
    where: { id },
    include: { engagement: { select: { lawyerId: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.uploadedById !== userId && doc.engagement.lawyerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete file (best-effort), then DB row
  try {
    await unlink(join(CONTRACTS_ROOT, doc.fileKey));
  } catch {
    // ignore — DB record removed below regardless
  }
  await db.contractDocument.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
