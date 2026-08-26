"use server";

import { revalidatePath } from "next/cache";
import { createRecordedVideo } from "@/modules/recordings/application/create-recorded-video";
import { updateRecordedVideo } from "@/modules/recordings/application/update-recorded-video";
import { deleteRecordedVideo } from "@/modules/recordings/application/delete-recorded-video";
import { setRecordedVideoStatus } from "@/modules/recordings/application/set-recorded-video-status";
import { reorderRecordedVideos } from "@/modules/recordings/application/reorder-recorded-videos";
import { retryVideoProcessing } from "@/modules/recordings/application/retry-video-processing";
import {
  createRecordedVideoSchema,
  updateRecordedVideoSchema,
} from "@/modules/recordings/application/recorded-video.schema";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveRecordingActor } from "@/modules/recordings/infrastructure/recording-actor";
import type { RecordedVideoStatus } from "@/modules/recordings/domain/recorded-video";
import type { ActionState } from "@/shared/domain/action-state";

const LIST_PATH = "/dashboard/teacher/recorded-courses";

function revalidateFor(courseId: string): void {
  revalidatePath(LIST_PATH);
  revalidatePath(`/dashboard/teacher/courses/${courseId}/recordings`);
  revalidatePath(`/dashboard/student/courses/${courseId}/lessons`);
}

export async function createRecordedVideoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await resolveRecordingActor();
  if (!actor) return { error: "You must be signed in." };

  const parsed = createRecordedVideoSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description"),
    videoAssetId: formData.get("videoAssetId"),
    status: formData.get("status") ?? "DRAFT",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createRecordedVideo(recordings, actor, parsed.data);
  if (!result.ok) return { error: result.error.message };

  revalidateFor(result.value.courseId);
  return {};
}

export async function updateRecordedVideoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await resolveRecordingActor();
  if (!actor) return { error: "You must be signed in." };

  const rawAssetId = formData.get("videoAssetId");
  const parsed = updateRecordedVideoSchema.safeParse({
    id: formData.get("id"),
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    // An absent field means "leave the attached video alone".
    ...(rawAssetId !== null ? { videoAssetId: rawAssetId } : {}),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateRecordedVideo(recordings, actor, parsed.data);
  if (!result.ok) return { error: result.error.message };

  revalidateFor(result.value.courseId);
  revalidatePath(`/dashboard/teacher/courses/${parsed.data.courseId}/recordings`);
  return {};
}

export async function deleteRecordedVideoAction(id: string): Promise<void> {
  const actor = await resolveRecordingActor();
  if (!actor) return;

  const existing = await recordings.recordedVideoRepository.findById(id);
  const result = await deleteRecordedVideo(recordings, actor, { id });
  if (result.ok && existing) revalidateFor(existing.courseId);
}

export async function setRecordedVideoStatusAction(
  id: string,
  status: RecordedVideoStatus,
): Promise<void> {
  const actor = await resolveRecordingActor();
  if (!actor) return;

  const result = await setRecordedVideoStatus(recordings, actor, { id, status });
  if (result.ok) revalidateFor(result.value.courseId);
}

export async function retryVideoProcessingAction(id: string): Promise<void> {
  const actor = await resolveRecordingActor();
  if (!actor) return;

  const existing = await recordings.recordedVideoRepository.findById(id);
  const result = await retryVideoProcessing(recordings, actor, { id });
  if (result.ok && existing) revalidateFor(existing.courseId);
}

export async function reorderRecordedVideosAction(
  courseId: string,
  orderedIds: string[],
): Promise<{ error?: string }> {
  const actor = await resolveRecordingActor();
  if (!actor) return { error: "You must be signed in." };

  const result = await reorderRecordedVideos(recordings, actor, { courseId, orderedIds });
  if (!result.ok) return { error: result.error.message };

  revalidateFor(courseId);
  return {};
}
