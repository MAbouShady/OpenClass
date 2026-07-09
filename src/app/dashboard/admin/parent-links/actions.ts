"use server";

import { revalidatePath } from "next/cache";
import { createParentLink } from "@/modules/family/application/create-parent-link";
import { deleteParentLink } from "@/modules/family/application/delete-parent-link";
import { createParentLinkSchema } from "@/modules/family/application/create-parent-link.schema";
import { PrismaParentLinkRepository } from "@/modules/family/infrastructure/prisma-parent-link-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import type { ActionState } from "@/shared/domain/action-state";

const parentLinkRepository = new PrismaParentLinkRepository();
const userRepository = new PrismaUserRepository();

export async function createParentLinkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createParentLinkSchema.safeParse({
    parentEmail: formData.get("parentEmail"),
    studentEmail: formData.get("studentEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createParentLink({ parentLinkRepository, userRepository }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/admin/parent-links");
  return {};
}

export async function deleteParentLinkAction(id: string): Promise<void> {
  await deleteParentLink({ parentLinkRepository }, { id });
  revalidatePath("/dashboard/admin/parent-links");
}
