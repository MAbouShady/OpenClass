-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'PER_SEMESTER');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY';
