import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type {
  RecordedVideoRepository,
  RecordedVideoWithAsset,
} from "@/modules/recordings/domain/recorded-video-repository";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";

export type ListRecordedVideosDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
};

/** Every recorded video the actor is allowed to manage. */
export async function listManageableRecordedVideos(
  deps: ListRecordedVideosDeps,
  actor: RecordingActor,
): Promise<RecordedVideoWithAsset[]> {
  const [videos, courses] = await Promise.all([
    deps.recordedVideoRepository.findAll(),
    deps.courseRepository.findAll(),
  ]);

  const manageableCourseIds = new Set(
    courses.filter((course) => canManageCourse(actor, course)).map((course) => course.id),
  );

  return videos.filter((video) => manageableCourseIds.has(video.courseId));
}

export function listRecordedVideosForCourse(
  deps: Pick<ListRecordedVideosDeps, "recordedVideoRepository">,
  courseId: string,
): Promise<RecordedVideoWithAsset[]> {
  return deps.recordedVideoRepository.findByCourse(courseId);
}
