import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const CONTRACTS_ROOT = join(process.cwd(), "contracts");

// POST /api/mobile/engagements/[id]/documents — multipart upload (Bearer auth)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: engagementId } = await params;

  const engagement = await db.engagement.findUnique({
    where: { id: engagementId },
    select: { buyerId: true, lawyerId: true },
  });
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (engagement.buyerId !== session.id && engagement.lawyerId !== session.id) {
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
      { error: "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 400 });
  }

  const engagementDir = join(CONTRACTS_ROOT, engagementId);
  await mkdir(engagementDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${randomUUID()}-${safeName}`;
  const fullPath = join(engagementDir, key);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, bytes);

  const doc = await db.contractDocument.create({
    data: {
      engagementId,
      documentType,
      fileName: file.name,
      fileKey: `${engagementId}/${key}`,
      fileSize: bytes.byteLength,
      mimeType: file.type,
      uploadedById: session.id,
      notes,
    },
    include: { uploadedBy: { select: { id: true, name: true, role: true } } },
  });

  await db.engagement.update({
    where: { id: engagementId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    document: {
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      notes: doc.notes,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt.toISOString(),
    },
  });
}
