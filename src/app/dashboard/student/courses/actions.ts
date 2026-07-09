"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { enrollStudent } from "@/modules/enrollments/application/enroll-student";
import { enrollStudentSchema } from "@/modules/enrollments/application/enroll-student.schema";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { submitOnlinePayment } from "@/modules/payments/application/submit-online-payment";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import type { ActionState } from "@/shared/domain/action-state";

const enrollmentRepository = new PrismaEnrollmentRepository();
const semesterRepository = new PrismaSemesterRepository();
const paymentRepository = new PrismaPaymentRepository();

export async function enrollAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) {
    return { error: "You must be signed in." };
  }

  const parsed = enrollStudentSchema.safeParse({
    studentId: session.user.id,
    semesterId: formData.get("semesterId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await enrollStudent({ enrollmentRepository, semesterRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/student/courses");
  return {};
}

export async function submitPaymentAction(
  enrollmentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) {
    return { error: "You must be signed in." };
  }

  const proofUrl = formData.get("proofUrl");
  const result = await submitOnlinePayment(
    { paymentRepository },
    {
      enrollmentId,
      month: normalizeToMonthStart(new Date()),
      proofUrl: String(proofUrl ?? ""),
      notes: null,
    },
  );
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/student/courses");
  return {};
}
