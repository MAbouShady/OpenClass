-- DropIndex
DROP INDEX "Level_name_key";

-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "teacherId" TEXT;

-- CreateIndex
CREATE INDEX "Level_teacherId_idx" ON "Level"("teacherId");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
