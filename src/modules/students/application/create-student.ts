import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { StudentRepository } from "@/modules/students/domain/student-repository";
import type { Student } from "@/modules/students/domain/student";
import { createStudentSchema } from "@/modules/students/application/student.schema";

type Deps = { readonly studentRepository: StudentRepository };

export type CreateStudentResult = {
  readonly student: Student;
  readonly temporaryPassword: string | null;
  readonly isExisting: boolean;
};

export async function createStudent(
  deps: Deps,
  input: unknown,
  teacherId: string,
  parentId: string | null,
): Promise<CreateStudentResult> {
  const data = createStudentSchema.parse(input);
  const { studentRepository } = deps;

  // Dedup: phone first, then email
  const existingByPhone = await studentRepository.findByPhone(data.phone);
  const existingByEmail = data.email ? await studentRepository.findByEmail(data.email) : null;
  const existing = existingByPhone ?? existingByEmail;

  if (existing) {
    const alreadyLinked = await studentRepository.isLinkedToTeacher(existing.id, teacherId);
    if (alreadyLinked) {
      throw new Error("This student is already in your roster.");
    }

    // Link existing user as teacher's student
    await studentRepository.linkToTeacher(existing.id, teacherId);

    // Assign idNumber if missing
    const idNumber = await studentRepository.assignIdNumberIfMissing(existing.id);

    // Enroll in selected semesters
    if (data.semesterIds.length > 0) {
      await studentRepository.enrollInSemesters(existing.id, data.semesterIds);
    }

    // Set parent if provided
    const resolvedParent = parentId ?? data.parentId ?? null;
    if (resolvedParent) {
      await studentRepository.setParent(existing.id, resolvedParent);
    }

    return {
      student: { ...existing, idNumber },
      temporaryPassword: null,
      isExisting: true,
    };
  }

  // New user
  const temporaryPassword = randomBytes(6).toString("hex");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const student = await studentRepository.create({
    teacherId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    idNumber: data.idNumber,
    levelId: data.levelId,
    passwordHash,
    semesterIds: data.semesterIds,
  });

  const resolvedParent = parentId ?? data.parentId ?? null;
  await studentRepository.setParent(student.id, resolvedParent);

  return { student, temporaryPassword, isExisting: false };
}
