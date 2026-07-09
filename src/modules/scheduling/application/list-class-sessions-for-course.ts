import type { ClassSession } from "@/modules/scheduling/domain/class-session";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";

export type ListClassSessionsForCourseDeps = {
  readonly classSessionRepository: ClassSessionRepository;
};

export function listClassSessionsForCourse(
  deps: ListClassSessionsForCourseDeps,
  courseId: string,
): Promise<ClassSession[]> {
  return deps.classSessionRepository.findByCourse(courseId);
}
