import type { Enrollment } from "@/modules/enrollments/domain/enrollment";

export type CreateEnrollmentInput = {
  readonly studentId: string;
  readonly semesterId: string;
};

export interface EnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>;
  findByStudentAndSemester(studentId: string, semesterId: string): Promise<Enrollment | null>;
  findByStudent(studentId: string): Promise<Enrollment[]>;
  findBySemester(semesterId: string): Promise<Enrollment[]>;
  create(input: CreateEnrollmentInput): Promise<Enrollment>;
}
