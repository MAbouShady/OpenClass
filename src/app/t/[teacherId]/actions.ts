"use server";

import { auth } from "@/auth";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { enrollStudent } from "@/modules/enrollments/application/enroll-student";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import type { ActionState } from "@/shared/domain/action-state";

const userRepository = new PrismaUserRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();
const studentRepository = new PrismaStudentRepository();
const paymentRepository = new PrismaPaymentRepository();

export type BookingResult = ActionState & {
  studentIdNumber?: number;
  alreadyEnrolled?: boolean;
  isPaid?: boolean;
};

async function enroll(studentId: string, semesterId: string): Promise<BookingResult> {
  const result = await enrollStudent(
    { enrollmentRepository, semesterRepository },
    { studentId, semesterId },
  );
  if (!result.ok) return { error: result.error.message };

  const semester = await semesterRepository.findById(semesterId);
  if (semester) {
    const course = await courseRepository.findById(semester.courseId);
    if (course?.levelId) {
      await studentRepository.setLevel(studentId, course.levelId);
    }
  }

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

  const existing = await enrollmentRepository.findByStudentAndSemester(user.id, semesterId);
  if (existing) {
    const idNumber = await studentRepository.assignIdNumberIfMissing(user.id);
    const [payments, semester] = await Promise.all([
      paymentRepository.findByEnrollment(existing.id),
      semesterRepository.findById(semesterId),
    ]);
    if (semester) {
      const course = await courseRepository.findById(semester.courseId);
      if (course?.levelId) await studentRepository.setLevel(user.id, course.levelId);
    }
    const isPaid = payments.some((p) => p.status === "APPROVED");
    return { alreadyEnrolled: true, isPaid, studentIdNumber: idNumber };
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
