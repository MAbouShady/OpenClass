"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createClassSession } from "@/modules/scheduling/application/create-class-session";
import { deleteClassSession } from "@/modules/scheduling/application/delete-class-session";
import { createClassSessionSchema } from "@/modules/scheduling/application/class-session.schema";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import type { ActionState } from "@/shared/domain/action-state";

const classSessionRepository = new PrismaClassSessionRepository();
const courseRepository = new PrismaCourseRepository();

async function canManage(courseId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;

  const course = await courseRepository.findById(courseId);
  return course?.teacherId === session.user.id;
}

export async function createSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createClassSessionSchema.safeParse({
    courseId: formData.get("courseId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await canManage(parsed.data.courseId))) {
    return { error: "You do not have permission to manage this course." };
  }

  const result = await createClassSession({ classSessionRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/dashboard/teacher/courses/${parsed.data.courseId}/sessions`);
  return {};
}

export async function deleteSessionAction(courseId: string, sessionId: string): Promise<void> {
  if (!(await canManage(courseId))) return;

  await deleteClassSession({ classSessionRepository }, { id: sessionId });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/sessions`);
}
