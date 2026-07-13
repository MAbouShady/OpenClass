import type { StudentRepository } from "@/modules/students/domain/student-repository";
import { deleteStudentSchema } from "@/modules/students/application/student.schema";

type Deps = { readonly studentRepository: StudentRepository };

export async function deleteStudent(deps: Deps, input: unknown): Promise<void> {
  const { id } = deleteStudentSchema.parse(input);
  await deps.studentRepository.delete(id);
}
