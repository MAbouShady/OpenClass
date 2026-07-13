-- Delete existing sessions (no semesterId to backfill — dev data only)
DELETE FROM "Attendance" WHERE "sessionId" IN (SELECT "id" FROM "ClassSession");
DELETE FROM "ClassSession";

-- Add onDelete Cascade to ClassSession.courseId
ALTER TABLE "ClassSession" DROP CONSTRAINT IF EXISTS "ClassSession_courseId_fkey";
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add semesterId column
ALTER TABLE "ClassSession" ADD COLUMN "semesterId" TEXT NOT NULL;

-- Add FK to Semester
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_semesterId_fkey"
  FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint (no duplicate session start time per course)
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_startTime_key"
  UNIQUE ("courseId", "startTime");

-- Add index on semesterId
CREATE INDEX "ClassSession_semesterId_idx" ON "ClassSession"("semesterId");
