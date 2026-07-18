"use server";

import { auth } from "@/auth";
import { approvePayment } from "@/modules/payments/application/approve-payment";
import { markCashPayment } from "@/modules/payments/application/mark-cash-payment";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import type { ActionState } from "@/shared/domain/action-state";

const paymentRepository = new PrismaPaymentRepository();

export async function approvePaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Not signed in." };
  const id = String(formData.get("paymentId") ?? "");
  const result = await approvePayment({ paymentRepository }, { id, approvedById: session.user.id });
  if (!result.ok) return { error: result.error.message };
  return {};
}

export async function deletePaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Not signed in." };
  const id = String(formData.get("paymentId") ?? "");
  await paymentRepository.delete(id);
  return {};
}

export async function confirmCashPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Not signed in." };
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const monthStr = String(formData.get("month") ?? "");
  const month = new Date(monthStr);
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;
  const result = await markCashPayment(
    { paymentRepository },
    { enrollmentId, month, approvedById: session.user.id, notes },
  );
  if (!result.ok) return { error: result.error.message };
  return {};
}
