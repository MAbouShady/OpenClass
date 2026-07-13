"use server";

import { auth } from "@/auth";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { enrollStudent } from "@/modules/enrollments/application/enroll-student";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import type { ActionState } from "@/shared/domain/action-state";

const userRepository = new PrismaUserRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const semesterRepository = new PrismaSemesterRepository();
const studentRepository = new PrismaStudentRepository();

export type BookingResult = ActionState & { studentIdNumber?: number };

async function enroll(studentId: string, semesterId: string): Promise<BookingResult> {
  const result = await enrollStudent(
    { enrollmentRepository, semesterRepository },
    { studentId, semesterId },
  );
  if (!result.ok) return { error: result.error.message };
  const idNumber = await studentRepository.assignIdNumberIfMissing(studentId);
  return { studentIdNumber: idNumber };
}

export async function bookAsGuestAction(
  _prev: BookingResult,
  formData: FormData,
): Promise<BookingResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const semesterId = String(formData.get("semesterId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!name) return { error: "الاسم مطلوب." };
  if (!phone) return { error: "رقم التليفون مطلوب." };
  const user = await userRepository.findOrCreateByPhone(phone, name);
  if (teacherId) {
    await studentRepository.linkToTeacher(user.id, teacherId);
  }
  return enroll(user.id, semesterId);
}

export async function enrollLoggedInAction(
  _prev: BookingResult,
  formData: FormData,
): Promise<BookingResult> {
  const session = await auth();
  if (!session) return { error: "Not signed in." };
  return enroll(session.user.id, String(formData.get("semesterId")));
}
