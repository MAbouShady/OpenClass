"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createLevel } from "@/modules/levels/application/create-level";
import { deleteLevel } from "@/modules/levels/application/delete-level";
import { updateLevel } from "@/modules/levels/application/update-level";
import { createLevelSchema, updateLevelSchema } from "@/modules/levels/application/level.schema";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import type { ActionState } from "@/shared/domain/action-state";

const levelRepository = new PrismaLevelRepository();

export async function createTeacherLevelAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.id) return { error: "Unauthorized" };

  const parsed = createLevelSchema.safeParse({
    name: formData.get("name"),
    order: formData.get("order"),
    description: formData.get("description"),
    parentLevelId: formData.get("parentLevelId") || null,
    teacherId: session.user.id,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createLevel({ levelRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/teacher/levels");
  return {};
}

export async function updateTeacherLevelAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateLevelSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    order: formData.get("order"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateLevel({ levelRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/teacher/levels");
  return {};
}

export async function deleteTeacherLevelAction(id: string): Promise<void> {
  await deleteLevel({ levelRepository }, { id });
  revalidatePath("/dashboard/teacher/levels");
}
