"use server";

import { revalidatePath } from "next/cache";
import { createLevel } from "@/modules/levels/application/create-level";
import { deleteLevel } from "@/modules/levels/application/delete-level";
import { updateLevel } from "@/modules/levels/application/update-level";
import { createLevelSchema, updateLevelSchema } from "@/modules/levels/application/level.schema";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import type { ActionState } from "@/shared/domain/action-state";

const levelRepository = new PrismaLevelRepository();

export async function createLevelAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createLevelSchema.safeParse({
    name: formData.get("name"),
    order: formData.get("order"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createLevel({ levelRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/admin/levels");
  return {};
}

export async function updateLevelAction(
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

  revalidatePath("/dashboard/admin/levels");
  return {};
}

export async function deleteLevelAction(id: string): Promise<void> {
  await deleteLevel({ levelRepository }, { id });
  revalidatePath("/dashboard/admin/levels");
}
