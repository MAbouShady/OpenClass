import type { Semester } from "@/modules/semesters/domain/semester";
import type {
  CreateSemesterInput,
  SemesterRepository,
} from "@/modules/semesters/domain/semester-repository";

export class FakeSemesterRepository implements SemesterRepository {
  private semesters: Semester[];
  private nextId = 1;

  constructor(seed: Semester[] = []) {
    this.semesters = seed;
  }

  async findById(id: string): Promise<Semester | null> {
    return this.semesters.find((semester) => semester.id === id) ?? null;
  }

  async findByCourse(courseId: string): Promise<Semester[]> {
    return this.semesters.filter((semester) => semester.courseId === courseId);
  }

  async create(input: CreateSemesterInput): Promise<Semester> {
    const semester: Semester = { id: `semester-${this.nextId++}`, ...input };
    this.semesters.push(semester);
    return semester;
  }

  async delete(id: string): Promise<void> {
    this.semesters = this.semesters.filter((semester) => semester.id !== id);
  }
}
