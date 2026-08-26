import type { Course } from "@/modules/courses/domain/course";
import type { RecordedVideo } from "@/modules/recordings/domain/recorded-video";
import type {
  CreateRecordedVideoInput,
  RecordedVideoRepository,
  RecordedVideoWithAsset,
  UpdateRecordedVideoInput,
} from "@/modules/recordings/domain/recorded-video-repository";
import type { VideoAsset } from "@/modules/recordings/domain/video-asset";
import type {
  CreateVideoAssetInput,
  UpdateVideoAssetInput,
  VideoAssetRepository,
} from "@/modules/recordings/domain/video-asset-repository";
import type { LessonProgress } from "@/modules/recordings/domain/lesson-progress";
import type {
  LessonProgressRepository,
  UpsertLessonProgressInput,
} from "@/modules/recordings/domain/lesson-progress-repository";
import type { CourseAccessChecker } from "@/modules/recordings/domain/course-access";
import {
  decideCourseAccess,
  type CourseAccess,
  type EnrollmentAccessFacts,
} from "@/modules/recordings/domain/course-access-rules";
import type { PaymentFrequency } from "@/modules/courses/domain/payment-frequency";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { MediaStorage } from "@/modules/recordings/domain/media-storage";
import type { VideoProcessingQueue } from "@/modules/recordings/domain/video-processor";

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    title: "Laravel Fundamentals",
    description: null,
    price: null,
    sessionType: "ONLINE",
    paymentFrequency: "MONTHLY",
    isActive: true,
    levelId: "level-1",
    teacherId: "teacher-1",
    ...overrides,
  };
}

export function makeAsset(overrides: Partial<VideoAsset> = {}): VideoAsset {
  return {
    id: "asset-1",
    originalFilename: "lesson.mp4",
    originalKey: "videos/asset-1/original.mp4",
    mimeType: "video/mp4",
    sizeBytes: 1024,
    durationSeconds: 600,
    width: 1280,
    height: 720,
    hlsPrefix: "videos/asset-1/hls",
    thumbnailKey: "videos/asset-1/thumbnail.jpg",
    processingStatus: "READY",
    processingError: null,
    processingStartedAt: null,
    processedAt: null,
    attempts: 1,
    uploadedById: "teacher-1",
    ...overrides,
  };
}

type SeedVideo = Partial<RecordedVideoWithAsset> & { readonly id: string };

export function makeVideo(seed: SeedVideo): RecordedVideoWithAsset {
  return {
    courseId: "course-1",
    title: "Introduction",
    description: null,
    videoAssetId: "asset-1",
    position: 1,
    status: "PUBLISHED",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    asset: makeAsset(),
    ...seed,
  };
}

export class FakeRecordedVideoRepository implements RecordedVideoRepository {
  private videos: RecordedVideoWithAsset[];
  private nextId = 100;

  constructor(seed: RecordedVideoWithAsset[] = []) {
    this.videos = [...seed];
  }

  all(): readonly RecordedVideoWithAsset[] {
    return this.videos;
  }

  async findById(id: string): Promise<RecordedVideoWithAsset | null> {
    return this.videos.find((video) => video.id === id) ?? null;
  }

  async findByCourse(courseId: string): Promise<RecordedVideoWithAsset[]> {
    return this.videos
      .filter((video) => video.courseId === courseId)
      .sort((a, b) => a.position - b.position);
  }

  async findPublishedByCourse(courseId: string): Promise<RecordedVideoWithAsset[]> {
    return (await this.findByCourse(courseId)).filter((video) => video.status === "PUBLISHED");
  }

  async findAll(): Promise<RecordedVideoWithAsset[]> {
    return this.videos;
  }

  async findByAssetId(assetId: string): Promise<RecordedVideoWithAsset | null> {
    return this.videos.find((video) => video.videoAssetId === assetId) ?? null;
  }

  async nextPosition(courseId: string): Promise<number> {
    const positions = this.videos
      .filter((video) => video.courseId === courseId)
      .map((video) => video.position);
    return positions.length === 0 ? 1 : Math.max(...positions) + 1;
  }

  async create(input: CreateRecordedVideoInput): Promise<RecordedVideo> {
    const created = makeVideo({ id: `video-${this.nextId++}`, ...input, asset: null });
    this.videos.push(created);
    return created;
  }

  async update(id: string, input: UpdateRecordedVideoInput): Promise<RecordedVideo> {
    const index = this.videos.findIndex((video) => video.id === id);
    const existing = this.videos[index];
    if (!existing) throw new Error("not found");
    const updated = { ...existing, ...input };
    this.videos[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.videos = this.videos.filter((video) => video.id !== id);
  }

  async applyOrder(courseId: string, orderedIds: readonly string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const target = this.videos.find((video) => video.id === id && video.courseId === courseId);
      if (target) {
        this.videos[this.videos.indexOf(target)] = { ...target, position: index + 1 };
      }
    });
  }

  async compactPositions(courseId: string): Promise<void> {
    const ordered = await this.findByCourse(courseId);
    await this.applyOrder(
      courseId,
      ordered.map((video) => video.id),
    );
  }
}

export class FakeVideoAssetRepository implements VideoAssetRepository {
  private assets: VideoAsset[];
  private nextId = 100;

  constructor(seed: VideoAsset[] = []) {
    this.assets = [...seed];
  }

  async findById(id: string): Promise<VideoAsset | null> {
    return this.assets.find((asset) => asset.id === id) ?? null;
  }

  async findByStatus(status: VideoAsset["processingStatus"]): Promise<VideoAsset[]> {
    return this.assets.filter((asset) => asset.processingStatus === status);
  }

  async create(input: CreateVideoAssetInput): Promise<VideoAsset> {
    const asset = makeAsset({
      ...input,
      id: `asset-${this.nextId++}`,
      durationSeconds: null,
      width: null,
      height: null,
      hlsPrefix: null,
      thumbnailKey: null,
      attempts: 0,
    });
    this.assets.push(asset);
    return asset;
  }

  async update(id: string, input: UpdateVideoAssetInput): Promise<VideoAsset> {
    const index = this.assets.findIndex((asset) => asset.id === id);
    const existing = this.assets[index];
    if (!existing) throw new Error("not found");
    const updated = { ...existing, ...input };
    this.assets[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.assets = this.assets.filter((asset) => asset.id !== id);
  }
}

export class FakeLessonProgressRepository implements LessonProgressRepository {
  private rows: LessonProgress[] = [];

  async find(userId: string, recordedVideoId: string): Promise<LessonProgress | null> {
    return (
      this.rows.find((row) => row.userId === userId && row.recordedVideoId === recordedVideoId) ??
      null
    );
  }

  async findForUserAndVideos(
    userId: string,
    recordedVideoIds: readonly string[],
  ): Promise<LessonProgress[]> {
    return this.rows.filter(
      (row) => row.userId === userId && recordedVideoIds.includes(row.recordedVideoId),
    );
  }

  async upsert(input: UpsertLessonProgressInput): Promise<LessonProgress> {
    const existing = await this.find(input.userId, input.recordedVideoId);
    const row: LessonProgress = {
      id: existing?.id ?? `progress-${this.rows.length + 1}`,
      ...input,
    };
    this.rows = [
      ...this.rows.filter(
        (candidate) =>
          !(
            candidate.userId === input.userId && candidate.recordedVideoId === input.recordedVideoId
          ),
      ),
      row,
    ];
    return row;
  }
}

/**
 * Access double. Seeded with the same facts the real checker reads, so tests
 * exercise the actual decision rule rather than a stub of it.
 */
export class FakeCourseAccessChecker implements CourseAccessChecker {
  constructor(private readonly enrolments: readonly SeededEnrolment[] = []) {}

  private factsFor(studentId: string, courseId: string): EnrollmentAccessFacts[] {
    return this.enrolments
      .filter((entry) => entry.studentId === studentId && entry.courseId === courseId)
      .map(toFacts);
  }

  async checkCourseAccess(studentId: string, courseId: string, asOf: Date): Promise<CourseAccess> {
    return decideCourseAccess(this.factsFor(studentId, courseId), asOf);
  }

  async listCourseAccess(studentId: string, asOf: Date): Promise<Map<string, CourseAccess>> {
    const byCourse = new Map<string, EnrollmentAccessFacts[]>();
    for (const entry of this.enrolments.filter((e) => e.studentId === studentId)) {
      const facts = byCourse.get(entry.courseId) ?? [];
      facts.push(toFacts(entry));
      byCourse.set(entry.courseId, facts);
    }
    return new Map(
      [...byCourse].map(([courseId, facts]) => [courseId, decideCourseAccess(facts, asOf)]),
    );
  }
}

export type SeededEnrolment = {
  readonly studentId: string;
  readonly courseId: string;
  readonly semesterStartDate?: Date;
  readonly paymentFrequency?: PaymentFrequency;
  /** Months with an APPROVED payment. Anything pending simply is not listed. */
  readonly approvedMonths?: readonly Date[];
};

function toFacts(entry: SeededEnrolment): EnrollmentAccessFacts {
  return {
    enrollmentId: `enr-${entry.studentId}-${entry.courseId}`,
    semesterId: `sem-${entry.courseId}`,
    semesterStartDate: entry.semesterStartDate ?? new Date("2020-01-01"),
    paymentFrequency: entry.paymentFrequency ?? "MONTHLY",
    approvedMonths: entry.approvedMonths ?? [],
  };
}

/** Convenience: an enrolment that is started and paid for the given moment. */
export function paidEnrolment(
  studentId: string,
  courseId: string,
  asOf: Date = new Date(),
  overrides: Partial<SeededEnrolment> = {},
): SeededEnrolment {
  return {
    studentId,
    courseId,
    semesterStartDate: new Date("2020-01-01"),
    paymentFrequency: "MONTHLY",
    approvedMonths: [normalizeToMonthStart(asOf)],
    ...overrides,
  };
}

export class FakeProcessingQueue implements VideoProcessingQueue {
  readonly enqueued: string[] = [];

  enqueue(assetId: string): void {
    this.enqueued.push(assetId);
  }
}

/** In-memory MediaStorage double; enough to exercise the upload/cleanup flows. */
export class FakeMediaStorage implements MediaStorage {
  readonly objects = new Map<string, Uint8Array>();
  readonly uploads = new Map<string, Uint8Array>();
  readonly deletedPrefixes: string[] = [];

  async createUpload(uploadId: string): Promise<void> {
    this.uploads.set(uploadId, new Uint8Array(0));
  }

  async appendChunk(uploadId: string, offset: number, chunk: Uint8Array): Promise<number> {
    const current = this.uploads.get(uploadId) ?? new Uint8Array(0);
    if (current.byteLength !== offset) throw new Error("Chunk offset mismatch");
    const next = new Uint8Array(current.byteLength + chunk.byteLength);
    next.set(current);
    next.set(chunk, current.byteLength);
    this.uploads.set(uploadId, next);
    return next.byteLength;
  }

  async readUploadHead(uploadId: string, length: number): Promise<Uint8Array> {
    return (this.uploads.get(uploadId) ?? new Uint8Array(0)).slice(0, length);
  }

  async uploadedBytes(uploadId: string): Promise<number> {
    return this.uploads.get(uploadId)?.byteLength ?? 0;
  }

  async finalizeUpload(uploadId: string, key: string): Promise<void> {
    const data = this.uploads.get(uploadId);
    if (!data) throw new Error("no upload");
    this.objects.set(key, data);
    this.uploads.delete(uploadId);
  }

  async abortUpload(uploadId: string): Promise<void> {
    this.uploads.delete(uploadId);
  }

  async stat(key: string) {
    const object = this.objects.get(key);
    return object ? { sizeBytes: object.byteLength } : null;
  }

  async read(key: string): Promise<Uint8Array> {
    return this.objects.get(key) ?? new Uint8Array(0);
  }

  async exists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async deletePrefix(prefix: string): Promise<void> {
    this.deletedPrefixes.push(prefix);
    for (const key of [...this.objects.keys()]) {
      if (key.startsWith(prefix)) this.objects.delete(key);
    }
  }

  async materialize(key: string) {
    return { path: `/tmp/${key}`, cleanup: async () => {} };
  }

  async putDirectory(): Promise<void> {}

  async putObject(key: string, data: Uint8Array): Promise<void> {
    this.objects.set(key, data);
  }
}

export const TEACHER = {
  userId: "teacher-1",
  role: "TEACHER" as const,
  managedTeacherId: "teacher-1",
};
export const OTHER_TEACHER = {
  userId: "teacher-2",
  role: "TEACHER" as const,
  managedTeacherId: "teacher-2",
};
export const ADMIN = { userId: "admin-1", role: "ADMIN" as const, managedTeacherId: null };
export const SECRETARY = {
  userId: "sec-1",
  role: "SECRETARY" as const,
  managedTeacherId: "teacher-1",
};
export const STUDENT = { userId: "student-1", role: "STUDENT" as const, managedTeacherId: null };
export const OTHER_STUDENT = {
  userId: "student-2",
  role: "STUDENT" as const,
  managedTeacherId: null,
};
