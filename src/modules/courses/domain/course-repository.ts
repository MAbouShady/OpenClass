import type { Course } from "@/modules/courses/domain/course";
import type { SessionType } from "@/modules/courses/domain/session-type";
import type { PaymentFrequency } from "@/modules/courses/domain/payment-frequency";

export type CreateCourseInput = {
  readonly title: string;
  readonly description: string | null;
  readonly price: number | null;
  readonly sessionType: SessionType;
  readonly paymentFrequency: PaymentFrequency;
  readonly levelId: string;
  readonly teacherId: string;
};

export type UpdateCourseInput = Partial<Omit<CreateCourseInput, "teacherId">> & {
  readonly isActive?: boolean;
};

export interface CourseRepository {
  findById(id: string): Promise<Course | null>;
  findByTeacher(teacherId: string): Promise<Course[]>;
  findActiveByTeacher(teacherId: string): Promise<Course[]>;
  findAll(): Promise<Course[]>;
  create(input: CreateCourseInput): Promise<Course>;
  update(id: string, input: UpdateCourseInput): Promise<Course>;
  delete(id: string): Promise<void>;
}
