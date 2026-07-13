import type { StudentRepository } from "@/modules/students/domain/student-repository";
import type { StudentWithCourses } from "@/modules/students/domain/student";

type Deps = { readonly studentRepository: StudentRepository };

export function listStudentsForTeacher(
  deps: Deps,
  teacherId: string,
): Promise<StudentWithCourses[]> {
  return deps.studentRepository.findByTeacher(teacherId);
}
