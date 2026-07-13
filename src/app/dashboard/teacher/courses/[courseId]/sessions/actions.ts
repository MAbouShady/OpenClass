"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createClassSession } from "@/modules/scheduling/application/create-class-session";
import { deleteClassSession } from "@/modules/scheduling/application/delete-class-session";
import { bulkCreateClassSessions } from "@/modules/scheduling/application/bulk-create-class-sessions";
import { createClassSessionSchema } from "@/modules/scheduling/application/class-session.schema";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import type { ActionState } from "@/shared/domain/action-state";

const classSessionRepository = new PrismaClassSessionRepository();
const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();

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
    semesterId: formData.get("semesterId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await canManage(parsed.data.courseId))) {
    return { error: "You do not have permission to manage this course." };
  }

  // Verify session falls within semester bounds
  const semester = await semesterRepository.findById(parsed.data.semesterId);
  if (!semester) return { error: "Semester not found." };
  if (
    parsed.data.startTime < semester.startDate ||
    parsed.data.endTime > new Date(semester.endDate.getTime() + 86_400_000)
  ) {
    return { error: "Session must fall within the semester dates." };
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

export async function bulkCreateSessionsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const courseId = String(formData.get("courseId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  if (!courseId || !semesterId) return { error: "Missing course or semester." };

  if (!(await canManage(courseId))) {
    return { error: "You do not have permission to manage this course." };
  }

  // Verify semester belongs to this course
  const semester = await semesterRepository.findById(semesterId);
  if (!semester || semester.courseId !== courseId) {
    return { error: "Semester not found." };
  }

  const fromRaw = String(formData.get("fromDate") ?? "");
  const toRaw = String(formData.get("toDate") ?? "");
  const daysRaw = String(formData.get("days") ?? "");

  const fromDate = new Date(fromRaw + "T00:00:00");
  const toDate = new Date(toRaw + "T23:59:59");

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { error: "Invalid date range." };
  }
  if (fromDate > toDate) {
    return { error: "From date must be before to date." };
  }

  // Clamp to semester bounds
  const semFrom = new Date(semester.startDate);
  semFrom.setHours(0, 0, 0, 0);
  const semTo = new Date(semester.endDate);
  semTo.setHours(23, 59, 59, 999);

  if (fromDate < semFrom || toDate > semTo) {
    return { error: "Date range must be within the semester dates." };
  }

  const days = daysRaw
    .split(",")
    .map(Number)
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6);

  if (days.length === 0) return { error: "Select at least one day." };

  const schedule = days.map((day) => ({
    dayOfWeek: day,
    startHHMM: String(formData.get(`start_${day}`) ?? "09:00"),
    endHHMM: String(formData.get(`end_${day}`) ?? "10:00"),
  }));

  const { created, skippedDuplicate, skippedCap } = await bulkCreateClassSessions(
    { classSessionRepository },
    { courseId, semesterId, fromDate, toDate, schedule },
  );

  revalidatePath(`/dashboard/teacher/courses/${courseId}/sessions`);

  const parts: string[] = [`${created} session${created !== 1 ? "s" : ""} created.`];
  if (skippedDuplicate > 0)
    parts.push(`${skippedDuplicate} duplicate${skippedDuplicate !== 1 ? "s" : ""} skipped.`);
  if (skippedCap > 0)
    parts.push(`${skippedCap} skipped (500-session cap).`);

  return { message: parts.join(" ") };
}
