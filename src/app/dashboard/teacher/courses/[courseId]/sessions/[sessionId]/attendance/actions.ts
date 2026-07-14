"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { scanEntry } from "@/modules/attendance/application/scan-entry";
import { scanExit } from "@/modules/attendance/application/scan-exit";
import { manualMarkAttendance } from "@/modules/attendance/application/manual-mark-attendance";
import { PrismaAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-attendance-repository";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import type { ActionState } from "@/shared/domain/action-state";
import type { DomainError } from "@/shared/domain/result";

const ATTENDANCE_ERROR_KEY: Record<string, string> = {
  INVALID_QR_TOKEN: "errInvalidQr",
  WRONG_COURSE: "errWrongCourse",
  ONLINE_SCAN_NOT_ALLOWED: "errOnlineScan",
  ENROLLMENT_REQUIRED: "errNotEnrolled",
  PAYMENT_REQUIRED: "errPaymentRequired",
  ALREADY_CHECKED_IN: "errAlreadyCheckedIn",
  NOT_CHECKED_IN: "errNotCheckedIn",
  ALREADY_CHECKED_OUT: "errAlreadyCheckedOut",
};

async function attendanceError(err: DomainError): Promise<string> {
  const key = ATTENDANCE_ERROR_KEY[err.code];
  if (!key) return err.message;
  const t = await getTranslations("attendance");
  return t(key as Parameters<typeof t>[0]);
}

const attendanceRepository = new PrismaAttendanceRepository();
const classSessionRepository = new PrismaClassSessionRepository();
const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const paymentRepository = new PrismaPaymentRepository();
const studentRepository = new PrismaStudentRepository();

async function canManage(courseId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;

  const course = await courseRepository.findById(courseId);
  return course?.teacherId === session.user.id;
}

export async function scanEntryAction(
  courseId: string,
  sessionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await canManage(courseId))) {
    return { error: "You do not have permission to manage this course." };
  }

  const qrToken = String(formData.get("qrToken") ?? "");
  const result = await scanEntry(
    {
      attendanceRepository,
      classSessionRepository,
      courseRepository,
      semesterRepository,
      enrollmentRepository,
      paymentRepository,
      studentRepository,
    },
    { qrToken, sessionId },
  );
  if (!result.ok) {
    return { error: await attendanceError(result.error) };
  }

  revalidatePath(`/dashboard/teacher/courses/${courseId}/sessions/${sessionId}/attendance`);
  return {};
}

export async function scanExitAction(
  courseId: string,
  sessionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await canManage(courseId))) {
    return { error: "You do not have permission to manage this course." };
  }

  const qrToken = String(formData.get("qrToken") ?? "");
  const result = await scanExit(
    { attendanceRepository, classSessionRepository, studentRepository },
    { qrToken, sessionId },
  );
  if (!result.ok) {
    return { error: await attendanceError(result.error) };
  }

  revalidatePath(`/dashboard/teacher/courses/${courseId}/sessions/${sessionId}/attendance`);
  return {};
}

export async function markAttendanceAction(
  courseId: string,
  sessionId: string,
  studentId: string,
  status: "PRESENT" | "ABSENT",
): Promise<void> {
  if (!(await canManage(courseId))) return;

  await manualMarkAttendance({ attendanceRepository }, { studentId, sessionId, status });
  revalidatePath(`/dashboard/teacher/courses/${courseId}/sessions/${sessionId}/attendance`);
}
