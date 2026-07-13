-- DropIndex
DROP INDEX "User_levelId_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paymentDetails" TEXT;
