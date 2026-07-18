import type { Student, StudentWithCourses } from "@/modules/students/domain/student";
import type {
  CreateStudentInput,
  ParentOption,
  StudentRepository,
  UpdateStudentInput,
} from "@/modules/students/domain/student-repository";

export class FakeStudentRepository implements StudentRepository {
  private students: (Student & { idNumber: number })[];

  constructor(students: (Student & { idNumber: number })[] = []) {
    this.students = students;
  }

  async findByIdNumber(idNumber: number): Promise<Student | null> {
    return this.students.find((s) => s.idNumber === idNumber) ?? null;
  }

  async findById(_id: string): Promise<StudentWithCourses | null> { throw new Error("not implemented"); }
  async findByEmail(_email: string): Promise<Student | null> { throw new Error("not implemented"); }
  async findByPhone(_phone: string): Promise<Student | null> { throw new Error("not implemented"); }
  async findByTeacher(_teacherId: string): Promise<StudentWithCourses[]> { throw new Error("not implemented"); }
  async isLinkedToTeacher(_studentId: string, _teacherId: string): Promise<boolean> { throw new Error("not implemented"); }
  async linkToTeacher(_studentId: string, _teacherId: string): Promise<void> { throw new Error("not implemented"); }
  async assignIdNumberIfMissing(_studentId: string): Promise<number> { throw new Error("not implemented"); }
  async findAllParents(): Promise<ParentOption[]> { throw new Error("not implemented"); }
  async create(_input: CreateStudentInput): Promise<Student> { throw new Error("not implemented"); }
  async update(_id: string, _input: UpdateStudentInput): Promise<Student> { throw new Error("not implemented"); }
  async setParent(_studentId: string, _parentId: string | null): Promise<void> { throw new Error("not implemented"); }
  async enrollInSemesters(_studentId: string, _semesterIds: readonly string[]): Promise<void> { throw new Error("not implemented"); }
  async delete(_id: string): Promise<void> { throw new Error("not implemented"); }
  async unenrollFromSemester(_enrollmentId: string): Promise<void> { throw new Error("not implemented"); }
  async setLevel(_studentId: string, _levelId: string): Promise<void> { throw new Error("not implemented"); }
}
