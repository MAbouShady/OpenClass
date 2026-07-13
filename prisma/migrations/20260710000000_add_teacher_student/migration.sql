CREATE TABLE "TeacherStudent" (
  "teacherId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherStudent_pkey" PRIMARY KEY ("teacherId","studentId")
);

CREATE INDEX "TeacherStudent_studentId_idx" ON "TeacherStudent"("studentId");

ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
