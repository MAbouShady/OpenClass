"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createCourse } from "@/modules/courses/application/create-course";
import { deleteCourse } from "@/modules/courses/application/delete-course";
import { updateCourse } from "@/modules/courses/application/update-course";
import {
  createCourseSchema,
  updateCourseSchema,
} from "@/modules/courses/application/course.schema";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import type { CourseActor } from "@/modules/courses/application/actor";
import type { ActionState } from "@/shared/domain/action-state";

const courseRepository = new PrismaCourseRepository();

async function requireActor(): Promise<CourseActor | null> {
  const session = await auth();
  if (!session) return null;
  return { userId: session.user.id, isAdmin: session.user.role === "ADMIN" };
}

export async function createCourseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) {
    return { error: "You must be signed in." };
  }

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    sessionType: formData.get("sessionType"),
    paymentFrequency: formData.get("paymentFrequency"),
    levelId: formData.get("levelId"),
    teacherId: session.user.id,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await createCourse({ courseRepository }, parsed.data);
  revalidatePath("/dashboard/teacher/courses");
  return {};
}

export async function updateCourseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  if (!actor) {
    return { error: "You must be signed in." };
  }

  const parsed = updateCourseSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    sessionType: formData.get("sessionType"),
    paymentFrequency: formData.get("paymentFrequency"),
    levelId: formData.get("levelId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateCourse({ courseRepository }, actor, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/teacher/courses");
  return {};
}

export async function deleteCourseAction(id: string): Promise<void> {
  const actor = await requireActor();
  if (!actor) return;

  await deleteCourse({ courseRepository }, actor, { id });
  revalidatePath("/dashboard/teacher/courses");
}
