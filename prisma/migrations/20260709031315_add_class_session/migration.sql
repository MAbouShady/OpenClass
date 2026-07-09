-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassSession_courseId_idx" ON "ClassSession"("courseId");

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
