import type { Semester } from "@/modules/semesters/domain/semester";

export type CreateSemesterInput = {
  readonly courseId: string;
  readonly startDate: Date;
  readonly endDate: Date;
};

export interface SemesterRepository {
  findById(id: string): Promise<Semester | null>;
  findByCourse(courseId: string): Promise<Semester[]>;
  create(input: CreateSemesterInput): Promise<Semester>;
  delete(id: string): Promise<void>;
}
