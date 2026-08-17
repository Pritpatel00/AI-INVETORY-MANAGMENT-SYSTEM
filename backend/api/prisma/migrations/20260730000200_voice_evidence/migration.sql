-- CreateTable
CREATE TABLE "voice_evidence" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "transcript" TEXT NOT NULL,
    "language" TEXT,
    "languageProbability" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voice_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_evidence_storageKey_key" ON "voice_evidence"("storageKey");
CREATE INDEX "voice_evidence_createdById_createdAt_idx" ON "voice_evidence"("createdById", "createdAt");
CREATE INDEX "voice_evidence_transactionId_idx" ON "voice_evidence"("transactionId");

-- AddForeignKey
ALTER TABLE "voice_evidence" ADD CONSTRAINT "voice_evidence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "voice_evidence" ADD CONSTRAINT "voice_evidence_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "inventory_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
