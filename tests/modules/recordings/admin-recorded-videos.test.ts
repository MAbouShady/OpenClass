// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRecordedVideo } from "@/modules/recordings/application/create-recorded-video";
import { updateRecordedVideo } from "@/modules/recordings/application/update-recorded-video";
import { deleteRecordedVideo } from "@/modules/recordings/application/delete-recorded-video";
import { setRecordedVideoStatus } from "@/modules/recordings/application/set-recorded-video-status";
import { reorderRecordedVideos } from "@/modules/recordings/application/reorder-recorded-videos";
import { listManageableRecordedVideos } from "@/modules/recordings/application/list-recorded-videos";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import {
  ADMIN,
  FakeMediaStorage,
  FakeRecordedVideoRepository,
  FakeVideoAssetRepository,
  OTHER_TEACHER,
  SECRETARY,
  TEACHER,
  makeAsset,
  makeCourse,
  makeVideo,
} from "./fakes";

function setup() {
  const courseRepository = new FakeCourseRepository([
    makeCourse({ id: "course-1", teacherId: "teacher-1" }),
    makeCourse({ id: "course-2", title: "DevOps", teacherId: "teacher-1" }),
    makeCourse({ id: "course-3", title: "Foreign", teacherId: "teacher-2" }),
  ]);
  const videoAssetRepository = new FakeVideoAssetRepository([
    makeAsset({ id: "asset-1", uploadedById: "teacher-1" }),
    makeAsset({ id: "asset-foreign", uploadedById: "teacher-2" }),
  ]);
  const recordedVideoRepository = new FakeRecordedVideoRepository([
    makeVideo({ id: "v1", courseId: "course-1", title: "Alpha", position: 1 }),
    makeVideo({ id: "v2", courseId: "course-1", title: "Bravo", position: 2 }),
    makeVideo({ id: "v3", courseId: "course-1", title: "Charlie", position: 3 }),
    makeVideo({ id: "f1", courseId: "course-3", title: "Foreign", position: 1 }),
  ]);
  const mediaStorage = new FakeMediaStorage();
  return { courseRepository, videoAssetRepository, recordedVideoRepository, mediaStorage };
}

describe("createRecordedVideo", () => {
  it("attaches the video to an existing course at the next free position", async () => {
    const deps = setup();

    const result = await createRecordedVideo(deps, TEACHER, {
      courseId: "course-1",
      title: "Deployment",
      description: "Ship it",
      videoAssetId: "asset-1",
      status: "PUBLISHED",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.courseId).toBe("course-1");
    expect(result.value.position).toBe(4);
  });

  it("lets a secretary act for the teacher they belong to", async () => {
    const deps = setup();

    const result = await createRecordedVideo(deps, SECRETARY, {
      courseId: "course-1",
      title: "Deployment",
      videoAssetId: null,
    });

    expect(result.ok).toBe(true);
  });

  it("refuses a course the actor does not manage", async () => {
    const deps = setup();

    const result = await createRecordedVideo(deps, OTHER_TEACHER, {
      courseId: "course-1",
      title: "Sneaky",
      videoAssetId: null,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("RECORDED_VIDEO_FORBIDDEN");
  });

  it("refuses an asset uploaded by somebody else", async () => {
    const deps = setup();

    const result = await createRecordedVideo(deps, TEACHER, {
      courseId: "course-1",
      title: "Borrowed",
      videoAssetId: "asset-foreign",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VIDEO_ASSET_NOT_FOUND");
  });
});

describe("updateRecordedVideo", () => {
  it("moves a video to another course, appending it and closing the old gap", async () => {
    const deps = setup();

    const result = await updateRecordedVideo(deps, TEACHER, {
      id: "v2",
      courseId: "course-2",
      title: "Bravo",
      description: null,
      status: "PUBLISHED",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.courseId).toBe("course-2");
    expect(result.value.position).toBe(1);

    const remaining = await deps.recordedVideoRepository.findByCourse("course-1");
    expect(remaining.map((video) => [video.id, video.position])).toEqual([
      ["v1", 1],
      ["v3", 2],
    ]);
  });

  it("refuses to move a video into a course the actor does not manage", async () => {
    const deps = setup();

    const result = await updateRecordedVideo(deps, TEACHER, {
      id: "v1",
      courseId: "course-3",
      title: "Alpha",
      description: null,
      status: "PUBLISHED",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("RECORDED_VIDEO_FORBIDDEN");
  });

  it("cleans up the replaced asset and its files", async () => {
    const deps = setup();
    await deps.videoAssetRepository.create({
      originalFilename: "new.mp4",
      originalKey: "videos/asset-new/original.mp4",
      mimeType: "video/mp4",
      sizeBytes: 10,
      uploadedById: "teacher-1",
      processingStatus: "PENDING",
    });
    deps.mediaStorage.objects.set("videos/asset-1/hls/master.m3u8", new Uint8Array([1]));

    const result = await updateRecordedVideo(deps, TEACHER, {
      id: "v1",
      courseId: "course-1",
      title: "Alpha",
      description: null,
      status: "PUBLISHED",
      videoAssetId: "asset-100",
    });

    expect(result.ok).toBe(true);
    expect(await deps.videoAssetRepository.findById("asset-1")).toBeNull();
    expect(deps.mediaStorage.deletedPrefixes).toContain("videos/asset-1");
  });

  it("refuses to edit somebody else's lesson", async () => {
    const deps = setup();

    const result = await updateRecordedVideo(deps, OTHER_TEACHER, {
      id: "v1",
      courseId: "course-1",
      title: "Hijacked",
      description: null,
      status: "PUBLISHED",
    });

    expect(result.ok).toBe(false);
  });
});

describe("setRecordedVideoStatus", () => {
  it("publishes and unpublishes a lesson", async () => {
    const deps = setup();

    const unpublished = await setRecordedVideoStatus(deps, TEACHER, { id: "v1", status: "DRAFT" });
    expect(unpublished.ok && unpublished.value.status).toBe("DRAFT");

    const published = await setRecordedVideoStatus(deps, ADMIN, { id: "v1", status: "PUBLISHED" });
    expect(published.ok && published.value.status).toBe("PUBLISHED");
  });

  it("refuses a foreign lesson", async () => {
    const deps = setup();
    const result = await setRecordedVideoStatus(deps, OTHER_TEACHER, {
      id: "v1",
      status: "DRAFT",
    });
    expect(result.ok).toBe(false);
  });
});

describe("reorderRecordedVideos", () => {
  it("persists the submitted order as dense positions", async () => {
    const deps = setup();

    const result = await reorderRecordedVideos(deps, TEACHER, {
      courseId: "course-1",
      orderedIds: ["v3", "v1", "v2"],
    });

    expect(result.ok).toBe(true);
    const ordered = await deps.recordedVideoRepository.findByCourse("course-1");
    expect(ordered.map((video) => video.id)).toEqual(["v3", "v1", "v2"]);
    expect(ordered.map((video) => video.position)).toEqual([1, 2, 3]);
  });

  it("rejects a list that omits one of the course's videos", async () => {
    const deps = setup();
    const result = await reorderRecordedVideos(deps, TEACHER, {
      courseId: "course-1",
      orderedIds: ["v1", "v2"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a list smuggling in another course's video", async () => {
    const deps = setup();
    const result = await reorderRecordedVideos(deps, TEACHER, {
      courseId: "course-1",
      orderedIds: ["v1", "v2", "f1"],
    });
    expect(result.ok).toBe(false);
  });

  it("refuses an actor who does not manage the course", async () => {
    const deps = setup();
    const result = await reorderRecordedVideos(deps, OTHER_TEACHER, {
      courseId: "course-1",
      orderedIds: ["v1", "v2", "v3"],
    });
    expect(result.ok).toBe(false);
  });
});

describe("deleteRecordedVideo", () => {
  it("removes the lesson, its asset and every derived file", async () => {
    const deps = setup();
    deps.mediaStorage.objects.set("videos/asset-1/hls/master.m3u8", new Uint8Array([1]));

    const result = await deleteRecordedVideo(deps, TEACHER, { id: "v2" });

    expect(result.ok).toBe(true);
    expect(await deps.recordedVideoRepository.findById("v2")).toBeNull();
    expect(await deps.videoAssetRepository.findById("asset-1")).toBeNull();
    expect(deps.mediaStorage.deletedPrefixes).toContain("videos/asset-1");
    expect(deps.mediaStorage.objects.has("videos/asset-1/hls/master.m3u8")).toBe(false);
  });

  it("renumbers the remaining lessons", async () => {
    const deps = setup();
    await deleteRecordedVideo(deps, TEACHER, { id: "v1" });

    const remaining = await deps.recordedVideoRepository.findByCourse("course-1");
    expect(remaining.map((video) => video.position)).toEqual([1, 2]);
  });

  it("refuses a foreign lesson", async () => {
    const deps = setup();
    const result = await deleteRecordedVideo(deps, OTHER_TEACHER, { id: "v1" });
    expect(result.ok).toBe(false);
    expect(await deps.recordedVideoRepository.findById("v1")).not.toBeNull();
  });
});

describe("listManageableRecordedVideos", () => {
  it("shows only the videos of courses the actor manages", async () => {
    const deps = setup();

    const mine = await listManageableRecordedVideos(deps, TEACHER);
    expect(mine.map((video) => video.id)).toEqual(["v1", "v2", "v3"]);

    const theirs = await listManageableRecordedVideos(deps, OTHER_TEACHER);
    expect(theirs.map((video) => video.id)).toEqual(["f1"]);

    const all = await listManageableRecordedVideos(deps, ADMIN);
    expect(all).toHaveLength(4);
  });
});
