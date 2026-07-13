"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createStudent } from "@/modules/students/application/create-student";
import { updateStudent } from "@/modules/students/application/update-student";
import { deleteStudent } from "@/modules/students/application/delete-student";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import type { ActionState } from "@/shared/domain/action-state";

const studentRepository = new PrismaStudentRepository();

export async function createStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized." };

  try {
    const semesterIds = formData.getAll("semesterIds").map(String).filter(Boolean);
    const { student, temporaryPassword, isExisting } = await createStudent(
      { studentRepository },
      {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        idNumber: formData.get("idNumber") ? Number(formData.get("idNumber")) : undefined,
        levelId: formData.get("levelId"),
        parentId: formData.get("parentId"),
        semesterIds,
      },
      session.user.id,
      null,
    );
    revalidatePath("/dashboard/teacher/students");
    if (isExisting) {
      return { message: `connected:#${student.idNumber} ${student.name}` };
    }
    return {
      message: `Student #${student.idNumber} created. Password: ${temporaryPassword}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create student.";
    if (msg.includes("already in your roster")) {
      return { error: msg };
    }
    if (msg.includes("Unique constraint") && msg.includes("email")) {
      return { error: "A user with that email already exists." };
    }
    if (msg.includes("Unique constraint") && msg.includes("idNumber")) {
      return { error: "That ID number is already taken." };
    }
    return { error: msg };
  }
}

export async function updateStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized." };

  try {
    await updateStudent(
      { studentRepository },
      {
        id: formData.get("id"),
        name: formData.get("name"),
        phone: formData.get("phone"),
        levelId: formData.get("levelId"),
        parentId: formData.get("parentId"),
      },
    );
    revalidatePath("/dashboard/teacher/students");
    return { message: "Student updated." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update student.";
    return { error: msg };
  }
}

export async function enrollStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized." };
  const studentId = formData.get("studentId");
  if (!studentId || typeof studentId !== "string") return { error: "Missing student." };
  const semesterIds = formData.getAll("semesterIds").map(String).filter(Boolean);
  if (semesterIds.length === 0) return { error: "Select at least one course." };
  try {
    await studentRepository.enrollInSemesters(studentId, semesterIds);
    revalidatePath("/dashboard/teacher/students");
    return { message: "Enrolled." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to enroll." };
  }
}

export async function unenrollStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized." };
  const enrollmentId = formData.get("enrollmentId");
  if (!enrollmentId || typeof enrollmentId !== "string") return { error: "Missing enrollment." };
  try {
    await studentRepository.unenrollFromSemester(enrollmentId);
    revalidatePath("/dashboard/teacher/students");
    return { message: "Unenrolled." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to unenroll." };
  }
}

export async function deleteStudentAction(id: string): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized." };
  try {
    await deleteStudent({ studentRepository }, { id });
    revalidatePath("/dashboard/teacher/students");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete student." };
  }
}
