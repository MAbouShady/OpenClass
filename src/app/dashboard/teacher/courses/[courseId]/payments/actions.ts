"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { approvePayment } from "@/modules/payments/application/approve-payment";
import { markCashPayment } from "@/modules/payments/application/mark-cash-payment";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { sendNotificationToUser } from "@/modules/notifications/application/send-notification-to-user";
import { PrismaPushSubscriptionRepository } from "@/modules/notifications/infrastructure/prisma-push-subscription-repository";
import { WebPushSender } from "@/modules/notifications/infrastructure/web-push-sender";
import type { ActionState } from "@/shared/domain/action-state";

const paymentRepository = new PrismaPaymentRepository();
const courseRepository = new PrismaCourseRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const pushSubscriptionRepository = new PrismaPushSubscriptionRepository();
const notificationSender = new WebPushSender();

async function requireManagerId(courseId: string): Promise<string | null> {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "ADMIN") return session.user.id;

  const course = await courseRepository.findById(courseId);
  return course?.teacherId === session.user.id ? session.user.id : null;
}

async function notifyStudentOfPaymentApproval(enrollmentId: string): Promise<void> {
  const enrollment = await enrollmentRepository.findById(enrollmentId);
  if (!enrollment) return;

  await sendNotificationToUser(
    { pushSubscriptionRepository, notificationSender },
    enrollment.studentId,
    {
      title: "Payment approved",
      body: "Your payment has been approved. You're all set for this month.",
      url: "/dashboard/student/courses",
    },
  );
}

export async function markCashPaymentAction(
  courseId: string,
  enrollmentId: string,
  monthIso: string,
): Promise<ActionState> {
  const managerId = await requireManagerId(courseId);
  if (!managerId) {
    return { error: "You do not have permission to manage this course." };
  }

  const result = await markCashPayment(
    { paymentRepository },
    { enrollmentId, month: new Date(monthIso), approvedById: managerId, notes: null },
  );
  if (!result.ok) {
    return { error: result.error.message };
  }

  await notifyStudentOfPaymentApproval(enrollmentId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/payments`);
  return {};
}

export async function approvePaymentAction(courseId: string, paymentId: string): Promise<void> {
  const managerId = await requireManagerId(courseId);
  if (!managerId) return;

  const result = await approvePayment(
    { paymentRepository },
    { id: paymentId, approvedById: managerId },
  );
  if (result.ok) {
    await notifyStudentOfPaymentApproval(result.value.enrollmentId);
  }
  revalidatePath(`/dashboard/teacher/courses/${courseId}/payments`);
}
