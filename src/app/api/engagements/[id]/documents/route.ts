import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Storage root for contract docs — OUTSIDE public/ so files can only be served via
// the authed /api/contracts/[id] route.
const CONTRACTS_ROOT = join(process.cwd(), "contracts");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { id: engagementId } = await params;

  // Auth: must be the buyer OR the assigned lawyer
  const engagement = await db.engagement.findUnique({
    where: { id: engagementId },
    select: { id: true, buyerId: true, lawyerId: true },
  });
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (engagement.buyerId !== userId && engagement.lawyerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const documentType = String(form.get("documentType") ?? "").trim();
  const notes = form.get("notes") ? String(form.get("notes")) : null;

  if (!documentType) {
    return NextResponse.json({ error: "documentType is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: PDF, JPG, PNG, WEBP.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max 10 MB.` },
      { status: 400 }
    );
  }

  // Write to disk: contracts/{engagementId}/{uuid}-{safeName}
  const engagementDir = join(CONTRACTS_ROOT, engagementId);
  await mkdir(engagementDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${randomUUID()}-${safeName}`;
  const fullPath = join(engagementDir, key);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, bytes);

  // Record in DB. fileKey is the relative path under CONTRACTS_ROOT.
  const doc = await db.contractDocument.create({
    data: {
      engagementId,
      documentType,
      fileName: file.name,
      fileKey: `${engagementId}/${key}`,
      fileSize: bytes.byteLength,
      mimeType: file.type,
      uploadedById: userId,
      notes,
    },
    include: { uploadedBy: { select: { id: true, name: true, role: true } } },
  });

  // Bump engagement updatedAt
  await db.engagement.update({
    where: { id: engagementId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ document: doc });
}
