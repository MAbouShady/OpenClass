-- Backfills the schema change shipped with the SECRETARY role feature, which
-- reached prisma/schema.prisma without a migration of its own.

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SECRETARY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secretaryOfId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_secretaryOfId_idx" ON "User"("secretaryOfId");

-- AddForeignKey
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_secretaryOfId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_secretaryOfId_fkey" FOREIGN KEY ("secretaryOfId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
