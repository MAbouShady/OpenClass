"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { updateProfile } from "@/modules/auth/application/update-profile";
import { updateProfileSchema } from "@/modules/auth/application/update-profile.schema";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import type { ActionState } from "@/shared/domain/action-state";

const userRepository = new PrismaUserRepository();

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) {
    return { error: "You must be signed in." };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await updateProfile({ userRepository }, session.user.id, parsed.data);
  revalidatePath("/dashboard/teacher/profile");
  return {};
}
