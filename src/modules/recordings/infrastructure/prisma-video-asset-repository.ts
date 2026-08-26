import { prisma } from "@/shared/infrastructure/prisma/client";
import type { VideoAsset, VideoProcessingStatus } from "@/modules/recordings/domain/video-asset";
import type {
  CreateVideoAssetInput,
  UpdateVideoAssetInput,
  VideoAssetRepository,
} from "@/modules/recordings/domain/video-asset-repository";
import { toVideoAsset } from "@/modules/recordings/infrastructure/video-asset-mapper";

export class PrismaVideoAssetRepository implements VideoAssetRepository {
  async findById(id: string): Promise<VideoAsset | null> {
    const row = await prisma.videoAsset.findUnique({ where: { id } });
    return row ? toVideoAsset(row) : null;
  }

  async findByStatus(status: VideoProcessingStatus): Promise<VideoAsset[]> {
    const rows = await prisma.videoAsset.findMany({
      where: { processingStatus: status },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toVideoAsset);
  }

  async create(input: CreateVideoAssetInput): Promise<VideoAsset> {
    const row = await prisma.videoAsset.create({
      data: { ...input, sizeBytes: BigInt(Math.trunc(input.sizeBytes)) },
    });
    return toVideoAsset(row);
  }

  async update(id: string, input: UpdateVideoAssetInput): Promise<VideoAsset> {
    const row = await prisma.videoAsset.update({ where: { id }, data: input });
    return toVideoAsset(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.videoAsset.delete({ where: { id } });
  }
}
