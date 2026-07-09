import type { Course } from "@/modules/courses/domain/course";
import type { SessionType } from "@/modules/courses/domain/session-type";

export type CreateCourseInput = {
  readonly title: string;
  readonly description: string | null;
  readonly sessionType: SessionType;
  readonly levelId: string;
  readonly teacherId: string;
};

export type UpdateCourseInput = Partial<Omit<CreateCourseInput, "teacherId">>;

export interface CourseRepository {
  findById(id: string): Promise<Course | null>;
  findByTeacher(teacherId: string): Promise<Course[]>;
  findAll(): Promise<Course[]>;
  create(input: CreateCourseInput): Promise<Course>;
  update(id: string, input: UpdateCourseInput): Promise<Course>;
  delete(id: string): Promise<void>;
}
