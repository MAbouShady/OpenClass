-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "parentLevelId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Level_parentLevelId_idx" ON "Level"("parentLevelId");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_parentLevelId_fkey" FOREIGN KEY ("parentLevelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
