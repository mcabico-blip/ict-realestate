import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

const CONTRACTS_ROOT = join(process.cwd(), "contracts");

// GET /api/mobile/contracts/[id] — stream a contract document (Bearer auth)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const doc = await db.contractDocument.findUnique({
    where: { id },
    include: { engagement: { select: { buyerId: true, lawyerId: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.engagement.buyerId !== session.id && doc.engagement.lawyerId !== session.id) {
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

// DELETE /api/mobile/contracts/[id] — uploader or lawyer can delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const doc = await db.contractDocument.findUnique({
    where: { id },
    include: { engagement: { select: { lawyerId: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.uploadedById !== session.id && doc.engagement.lawyerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await unlink(join(CONTRACTS_ROOT, doc.fileKey));
  } catch {
    // best-effort delete; DB row removed regardless
  }
  await db.contractDocument.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
