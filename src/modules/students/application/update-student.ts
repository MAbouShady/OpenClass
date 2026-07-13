import type { StudentRepository } from "@/modules/students/domain/student-repository";
import type { Student } from "@/modules/students/domain/student";
import { updateStudentSchema } from "@/modules/students/application/student.schema";

type Deps = { readonly studentRepository: StudentRepository };

export async function updateStudent(deps: Deps, input: unknown): Promise<Student> {
  const data = updateStudentSchema.parse(input);
  const student = await deps.studentRepository.update(data.id, {
    name: data.name,
    phone: data.phone,
    idNumber: data.idNumber ?? null,
    levelId: data.levelId,
  });
  await deps.studentRepository.setParent(student.id, data.parentId ?? null);
  return student;
}
