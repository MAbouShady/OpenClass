// @vitest-environment node
import { describe, expect, it } from "vitest";
import { startVideoUpload } from "@/modules/recordings/application/start-video-upload";
import { completeVideoUpload } from "@/modules/recordings/application/complete-video-upload";
import { runVideoProcessing } from "@/modules/recordings/application/run-video-processing";
import { retryVideoProcessing } from "@/modules/recordings/application/retry-video-processing";
import { MAX_PROCESSING_ATTEMPTS } from "@/modules/recordings/domain/video-asset";
import type { VideoProcessor } from "@/modules/recordings/domain/video-processor";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import {
  FakeMediaStorage,
  FakeProcessingQueue,
  FakeRecordedVideoRepository,
  FakeVideoAssetRepository,
  OTHER_TEACHER,
  STUDENT,
  TEACHER,
  makeAsset,
  makeCourse,
  makeVideo,
} from "./fakes";

const MP4_HEADER = new Uint8Array([
  0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 16,
]);

function uploadDeps() {
  return {
    mediaStorage: new FakeMediaStorage(),
    videoAssetRepository: new FakeVideoAssetRepository(),
    processingQueue: new FakeProcessingQueue(),
    maxBytes: 1_000_000,
    newUploadId: () => "upload-abcdefgh",
  };
}

describe("startVideoUpload", () => {
  it("issues an opaque authorization without exposing storage details", async () => {
    const deps = uploadDeps();

    const result = await startVideoUpload(deps, TEACHER, {
      filename: "lesson.mp4",
      mimeType: "video/mp4",
      sizeBytes: 500,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.uploadId).toBe("upload-abcdefgh");
    expect(result.value.uploadUrl).toBe("/api/recorded-videos/uploads/upload-abcdefgh");
    // The client learns an app route and an opaque id — never a bucket, a
    // storage root or a key.
    const serialized = JSON.stringify(result.value);
    expect(Object.keys(result.value).sort()).toEqual([
      "expiresAt",
      "strategy",
      "uploadId",
      "uploadUrl",
    ]);
    expect(serialized).not.toContain("storage");
    expect(serialized).not.toContain("original.");
  });

  it("opens an upload when the browser reported no MIME type at all", async () => {
    // The failure this reproduces: on a Windows machine with nothing registered
    // for .mkv, `file.type` is "" and the upload was rejected before it began,
    // while the same file uploaded fine from a Mac.
    const result = await startVideoUpload(uploadDeps(), TEACHER, {
      filename: "lesson.mkv",
      mimeType: "",
      sizeBytes: 500,
    });

    expect(result.ok).toBe(true);
  });

  it("opens an upload when the field is missing entirely", async () => {
    const result = await startVideoUpload(uploadDeps(), TEACHER, {
      filename: "lesson.mov",
      sizeBytes: 500,
    });

    expect(result.ok).toBe(true);
  });

  it("still refuses a filename that is not a video", async () => {
    const result = await startVideoUpload(uploadDeps(), TEACHER, {
      filename: "payload.php",
      mimeType: "",
      sizeBytes: 500,
    });

    expect(result.ok).toBe(false);
  });

  it("refuses a student", async () => {
    const result = await startVideoUpload(uploadDeps(), STUDENT, {
      filename: "lesson.mp4",
      mimeType: "video/mp4",
      sizeBytes: 500,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("RECORDED_VIDEO_FORBIDDEN");
  });

  it("refuses an oversized file up front", async () => {
    const result = await startVideoUpload(uploadDeps(), TEACHER, {
      filename: "lesson.mp4",
      mimeType: "video/mp4",
      sizeBytes: 99_000_000,
    });

    expect(result.ok).toBe(false);
  });
});

describe("completeVideoUpload", () => {
  it("stores the original privately and queues processing", async () => {
    const deps = uploadDeps();
    await deps.mediaStorage.createUpload("upload-abcdefgh");
    await deps.mediaStorage.appendChunk("upload-abcdefgh", 0, MP4_HEADER);

    const result = await completeVideoUpload(deps, TEACHER, {
      uploadId: "upload-abcdefgh",
      filename: "../../evil name.mp4",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.processingStatus).toBe("PENDING");
    expect(result.value.originalFilename).toBe("evil_name.mp4");
    expect(result.value.originalKey).toBe(`videos/${result.value.id}/original.mp4`);
    expect(deps.mediaStorage.objects.has(result.value.originalKey)).toBe(true);
    expect(deps.processingQueue.enqueued).toEqual([result.value.id]);
  });

  it("rejects bytes that are not a video and leaves nothing behind", async () => {
    const deps = uploadDeps();
    await deps.mediaStorage.createUpload("upload-abcdefgh");
    await deps.mediaStorage.appendChunk(
      "upload-abcdefgh",
      0,
      new TextEncoder().encode("<?php echo 1; ?>"),
    );

    const result = await completeVideoUpload(deps, TEACHER, {
      uploadId: "upload-abcdefgh",
      filename: "lesson.mp4",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_VIDEO_FILE");
    expect(deps.mediaStorage.uploads.size).toBe(0);
    expect(deps.mediaStorage.objects.size).toBe(0);
    expect(deps.processingQueue.enqueued).toEqual([]);
  });

  it("rejects an empty upload", async () => {
    const deps = uploadDeps();
    await deps.mediaStorage.createUpload("upload-abcdefgh");

    const result = await completeVideoUpload(deps, TEACHER, {
      uploadId: "upload-abcdefgh",
      filename: "lesson.mp4",
    });

    expect(result.ok).toBe(false);
  });

  it("refuses a student", async () => {
    const deps = uploadDeps();
    const result = await completeVideoUpload(deps, STUDENT, {
      uploadId: "upload-abcdefgh",
      filename: "lesson.mp4",
    });
    expect(result.ok).toBe(false);
  });
});

class StubProcessor implements VideoProcessor {
  constructor(private readonly behaviour: "ok" | "throw") {}

  async process() {
    if (this.behaviour === "throw") {
      throw new Error("ffmpeg exited with code 1: /srv/openclass/storage/media/x.mp4 is broken");
    }
    return {
      durationSeconds: 610,
      width: 1280,
      height: 720,
      hlsPrefix: "videos/asset-9/hls",
      thumbnailKey: "videos/asset-9/thumbnail.jpg",
    };
  }
}

describe("runVideoProcessing", () => {
  it("marks the asset ready and records what was produced", async () => {
    const videoAssetRepository = new FakeVideoAssetRepository([
      makeAsset({ id: "asset-9", processingStatus: "PENDING", attempts: 0, hlsPrefix: null }),
    ]);

    const outcome = await runVideoProcessing(
      { videoAssetRepository, videoProcessor: new StubProcessor("ok") },
      "asset-9",
    );

    expect(outcome).toBe("ready");
    const asset = await videoAssetRepository.findById("asset-9");
    expect(asset?.processingStatus).toBe("READY");
    expect(asset?.durationSeconds).toBe(610);
    expect(asset?.hlsPrefix).toBe("videos/asset-9/hls");
    expect(asset?.attempts).toBe(1);
  });

  it("records a failure so the admin can retry", async () => {
    const videoAssetRepository = new FakeVideoAssetRepository([
      makeAsset({ id: "asset-9", processingStatus: "PENDING", attempts: 0 }),
    ]);

    const outcome = await runVideoProcessing(
      { videoAssetRepository, videoProcessor: new StubProcessor("throw") },
      "asset-9",
    );

    expect(outcome).toBe("failed");
    const asset = await videoAssetRepository.findById("asset-9");
    expect(asset?.processingStatus).toBe("FAILED");
    expect(asset?.processingError).toContain("ffmpeg exited with code 1");
  });

  it("skips an asset another worker already claimed", async () => {
    const videoAssetRepository = new FakeVideoAssetRepository([
      makeAsset({ id: "asset-9", processingStatus: "PROCESSING" }),
    ]);

    const outcome = await runVideoProcessing(
      { videoAssetRepository, videoProcessor: new StubProcessor("ok") },
      "asset-9",
    );

    expect(outcome).toBe("skipped");
  });

  it("gives up after the attempt cap", async () => {
    const videoAssetRepository = new FakeVideoAssetRepository([
      makeAsset({
        id: "asset-9",
        processingStatus: "PENDING",
        attempts: MAX_PROCESSING_ATTEMPTS,
      }),
    ]);

    const outcome = await runVideoProcessing(
      { videoAssetRepository, videoProcessor: new StubProcessor("ok") },
      "asset-9",
    );

    expect(outcome).toBe("failed");
    expect((await videoAssetRepository.findById("asset-9"))?.processingStatus).toBe("FAILED");
  });
});

describe("retryVideoProcessing", () => {
  function retryDeps(processingStatus: "FAILED" | "READY" = "FAILED") {
    return {
      courseRepository: new FakeCourseRepository([makeCourse({ id: "course-1" })]),
      videoAssetRepository: new FakeVideoAssetRepository([
        makeAsset({ id: "asset-1", processingStatus, attempts: 3 }),
      ]),
      recordedVideoRepository: new FakeRecordedVideoRepository([
        makeVideo({
          id: "v1",
          courseId: "course-1",
          asset: makeAsset({ id: "asset-1", processingStatus, attempts: 3 }),
        }),
      ]),
      processingQueue: new FakeProcessingQueue(),
    };
  }

  it("re-queues a failed video and clears its error", async () => {
    const deps = retryDeps();

    const result = await retryVideoProcessing(deps, TEACHER, { id: "v1" });

    expect(result.ok).toBe(true);
    const asset = await deps.videoAssetRepository.findById("asset-1");
    expect(asset?.processingStatus).toBe("PENDING");
    expect(asset?.processingError).toBeNull();
    expect(asset?.attempts).toBe(0);
    expect(deps.processingQueue.enqueued).toEqual(["asset-1"]);
  });

  it("refuses an actor who does not manage the course", async () => {
    const deps = retryDeps();
    const result = await retryVideoProcessing(deps, OTHER_TEACHER, { id: "v1" });

    expect(result.ok).toBe(false);
    expect(deps.processingQueue.enqueued).toEqual([]);
  });

  it("refuses a video that is not in a retryable state", async () => {
    const deps = retryDeps("READY");
    const result = await retryVideoProcessing(deps, TEACHER, { id: "v1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VIDEO_PROCESSING_NOT_RETRYABLE");
  });
});
