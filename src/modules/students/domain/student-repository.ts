import type { Student, StudentWithCourses } from "@/modules/students/domain/student";

export type CourseOption = {
  readonly id: string;
  readonly title: string;
  readonly latestSemesterId: string | null;
};

export type CreateStudentInput = {
  readonly teacherId: string;
  readonly name: string;
  readonly email?: string | null;
  readonly passwordHash: string;
  readonly phone: string;
  readonly idNumber?: number;
  readonly levelId: string | null;
  readonly semesterIds: readonly string[];
};

export type UpdateStudentInput = {
  readonly name: string;
  readonly phone: string | null;
  readonly idNumber: number | null;
  readonly levelId: string | null;
};

export type ParentOption = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export interface StudentRepository {
  findById(id: string): Promise<StudentWithCourses | null>;
  findByIdNumber(idNumber: number): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  findByPhone(phone: string): Promise<Student | null>;
  findByTeacher(teacherId: string): Promise<StudentWithCourses[]>;
  isLinkedToTeacher(studentId: string, teacherId: string): Promise<boolean>;
  linkToTeacher(studentId: string, teacherId: string): Promise<void>;
  assignIdNumberIfMissing(studentId: string): Promise<number>;
  findAllParents(): Promise<ParentOption[]>;
  create(input: CreateStudentInput): Promise<Student>;
  update(id: string, input: UpdateStudentInput): Promise<Student>;
  setParent(studentId: string, parentId: string | null): Promise<void>;
  enrollInSemesters(studentId: string, semesterIds: readonly string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
