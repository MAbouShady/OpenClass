import type { Enrollment } from "@/modules/enrollments/domain/enrollment";
import type {
  CreateEnrollmentInput,
  EnrollmentRepository,
} from "@/modules/enrollments/domain/enrollment-repository";

export class FakeEnrollmentRepository implements EnrollmentRepository {
  private enrollments: Enrollment[];
  private nextId = 1;

  constructor(seed: Enrollment[] = []) {
    this.enrollments = seed;
  }

  async findById(id: string): Promise<Enrollment | null> {
    return this.enrollments.find((enrollment) => enrollment.id === id) ?? null;
  }

  async findBySemester(semesterId: string): Promise<Enrollment[]> {
    return this.enrollments.filter((enrollment) => enrollment.semesterId === semesterId);
  }

  async findByStudentAndSemester(
    studentId: string,
    semesterId: string,
  ): Promise<Enrollment | null> {
    return (
      this.enrollments.find(
        (enrollment) => enrollment.studentId === studentId && enrollment.semesterId === semesterId,
      ) ?? null
    );
  }

  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return this.enrollments.filter((enrollment) => enrollment.studentId === studentId);
  }

  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    const enrollment: Enrollment = { id: `enrollment-${this.nextId++}`, ...input };
    this.enrollments.push(enrollment);
    return enrollment;
  }
}
