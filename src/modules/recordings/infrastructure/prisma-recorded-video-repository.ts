import { prisma } from "@/shared/infrastructure/prisma/client";
import type { RecordedVideo } from "@/modules/recordings/domain/recorded-video";
import type {
  CreateRecordedVideoInput,
  RecordedVideoRepository,
  RecordedVideoWithAsset,
  UpdateRecordedVideoInput,
} from "@/modules/recordings/domain/recorded-video-repository";
import {
  toVideoAsset,
  type PrismaVideoAssetRow,
} from "@/modules/recordings/infrastructure/video-asset-mapper";

type RecordedVideoRow = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoAssetId: string | null;
  position: number;
  status: "DRAFT" | "PUBLISHED";
  createdAt: Date;
  updatedAt: Date;
};

function toRecordedVideo(row: RecordedVideoRow): RecordedVideo {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description,
    videoAssetId: row.videoAssetId,
    position: row.position,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toRecordedVideoWithAsset(
  row: RecordedVideoRow & { videoAsset: PrismaVideoAssetRow | null },
): RecordedVideoWithAsset {
  return { ...toRecordedVideo(row), asset: row.videoAsset ? toVideoAsset(row.videoAsset) : null };
}

const ORDER = [{ position: "asc" as const }, { createdAt: "asc" as const }];

export class PrismaRecordedVideoRepository implements RecordedVideoRepository {
  async findById(id: string): Promise<RecordedVideoWithAsset | null> {
    const row = await prisma.recordedVideo.findUnique({
      where: { id },
      include: { videoAsset: true },
    });
    return row ? toRecordedVideoWithAsset(row) : null;
  }

  async findByCourse(courseId: string): Promise<RecordedVideoWithAsset[]> {
    const rows = await prisma.recordedVideo.findMany({
      where: { courseId },
      include: { videoAsset: true },
      orderBy: ORDER,
    });
    return rows.map(toRecordedVideoWithAsset);
  }

  async findPublishedByCourse(courseId: string): Promise<RecordedVideoWithAsset[]> {
    const rows = await prisma.recordedVideo.findMany({
      where: { courseId, status: "PUBLISHED" },
      include: { videoAsset: true },
      orderBy: ORDER,
    });
    return rows.map(toRecordedVideoWithAsset);
  }

  async findAll(): Promise<RecordedVideoWithAsset[]> {
    const rows = await prisma.recordedVideo.findMany({
      include: { videoAsset: true },
      orderBy: [{ courseId: "asc" }, ...ORDER],
    });
    return rows.map(toRecordedVideoWithAsset);
  }

  async findByAssetId(assetId: string): Promise<RecordedVideoWithAsset | null> {
    const row = await prisma.recordedVideo.findUnique({
      where: { videoAssetId: assetId },
      include: { videoAsset: true },
    });
    return row ? toRecordedVideoWithAsset(row) : null;
  }

  async nextPosition(courseId: string): Promise<number> {
    const result = await prisma.recordedVideo.aggregate({
      where: { courseId },
      _max: { position: true },
    });
    return (result._max.position ?? 0) + 1;
  }

  async create(input: CreateRecordedVideoInput): Promise<RecordedVideo> {
    return toRecordedVideo(await prisma.recordedVideo.create({ data: input }));
  }

  async update(id: string, input: UpdateRecordedVideoInput): Promise<RecordedVideo> {
    return toRecordedVideo(await prisma.recordedVideo.update({ where: { id }, data: input }));
  }

  async delete(id: string): Promise<void> {
    await prisma.recordedVideo.delete({ where: { id } });
  }

  async applyOrder(courseId: string, orderedIds: readonly string[]): Promise<void> {
    // One transaction, and every write is scoped to `courseId`, so a forged id
    // cannot reposition a lesson that belongs to some other course.
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.recordedVideo.updateMany({
          where: { id, courseId },
          data: { position: index + 1 },
        }),
      ),
    );
  }

  async compactPositions(courseId: string): Promise<void> {
    const rows = await prisma.recordedVideo.findMany({
      where: { courseId },
      orderBy: ORDER,
      select: { id: true },
    });
    await this.applyOrder(
      courseId,
      rows.map((row) => row.id),
    );
  }
}
