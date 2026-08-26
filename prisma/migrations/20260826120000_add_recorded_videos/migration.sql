-- CreateEnum
CREATE TYPE "RecordedVideoStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "VideoProcessingStatus" AS ENUM ('UPLOADING', 'PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "VideoAsset" (
    "id" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "originalKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "durationSeconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "hlsPrefix" TEXT,
    "thumbnailKey" TEXT,
    "processingStatus" "VideoProcessingStatus" NOT NULL DEFAULT 'UPLOADING',
    "processingError" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordedVideo" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoAssetId" TEXT,
    "position" INTEGER NOT NULL,
    "status" "RecordedVideoStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedVideoId" TEXT NOT NULL,
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastPositionSeconds" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoAsset_processingStatus_idx" ON "VideoAsset"("processingStatus");

-- CreateIndex
CREATE INDEX "VideoAsset_uploadedById_idx" ON "VideoAsset"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "RecordedVideo_videoAssetId_key" ON "RecordedVideo"("videoAssetId");

-- CreateIndex
CREATE INDEX "RecordedVideo_courseId_position_idx" ON "RecordedVideo"("courseId", "position");

-- CreateIndex
CREATE INDEX "RecordedVideo_status_idx" ON "RecordedVideo"("status");

-- CreateIndex
CREATE INDEX "LessonProgress_recordedVideoId_idx" ON "LessonProgress"("recordedVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_recordedVideoId_key" ON "LessonProgress"("userId", "recordedVideoId");

-- AddForeignKey
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordedVideo" ADD CONSTRAINT "RecordedVideo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordedVideo" ADD CONSTRAINT "RecordedVideo_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "VideoAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_recordedVideoId_fkey" FOREIGN KEY ("recordedVideoId") REFERENCES "RecordedVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
