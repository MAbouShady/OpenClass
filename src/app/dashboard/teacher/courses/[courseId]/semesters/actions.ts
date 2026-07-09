"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createSemester } from "@/modules/semesters/application/create-semester";
import { deleteSemester } from "@/modules/semesters/application/delete-semester";
import { createSemesterSchema } from "@/modules/semesters/application/semester.schema";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import type { ActionState } from "@/shared/domain/action-state";

const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();

async function canManage(courseId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;

  const course = await courseRepository.findById(courseId);
  return course?.teacherId === session.user.id;
}

export async function createSemesterAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createSemesterSchema.safeParse({
    courseId: formData.get("courseId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await canManage(parsed.data.courseId))) {
    return { error: "You do not have permission to manage this course." };
  }

  const result = await createSemester({ semesterRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/dashboard/teacher/courses/${parsed.data.courseId}/semesters`);
  return {};
}

export async function deleteSemesterAction(courseId: string, semesterId: string): Promise<void> {
  if (!(await canManage(courseId))) return;

  await deleteSemester({ semesterRepository }, { id: semesterId });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/semesters`);
}
