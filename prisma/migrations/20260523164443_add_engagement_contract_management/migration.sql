-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('NEW', 'IN_REVIEW', 'AWAITING_DOCUMENTS', 'DRAFTING', 'PENDING_SIGNATURES', 'NOTARIZED', 'TITLE_TRANSFER', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDocument" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Engagement_lawyerId_status_idx" ON "Engagement"("lawyerId", "status");

-- CreateIndex
CREATE INDEX "Engagement_buyerId_idx" ON "Engagement"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_buyerId_propertyId_key" ON "Engagement"("buyerId", "propertyId");

-- CreateIndex
CREATE INDEX "ContractDocument_engagementId_idx" ON "ContractDocument"("engagementId");

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDocument" ADD CONSTRAINT "ContractDocument_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDocument" ADD CONSTRAINT "ContractDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
