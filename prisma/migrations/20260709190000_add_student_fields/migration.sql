ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "idNumber" INTEGER;
ALTER TABLE "User" ADD COLUMN "levelId" TEXT;

CREATE UNIQUE INDEX "User_idNumber_key" ON "User"("idNumber");
CREATE INDEX "User_levelId_idx" ON "User"("levelId");

ALTER TABLE "User" ADD CONSTRAINT "User_levelId_fkey"
  FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
