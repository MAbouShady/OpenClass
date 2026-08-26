import { notFound, redirect } from "next/navigation";
import { getCourseLessons } from "@/modules/recordings/application/get-course-lessons";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveStudentPortalActor } from "@/modules/recordings/infrastructure/recording-actor";

export const dynamic = "force-dynamic";

/** Sends the student to the first lesson they have not finished. */
export default async function PortalCourseLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const actor = await resolveStudentPortalActor();
  if (!actor) redirect("/student-portal");

  const result = await getCourseLessons(recordings, actor, courseId);
  if (!result || result.lessons.length === 0) notFound();

  const target = result.lessons.find((lesson) => !lesson.progress?.completed) ?? result.lessons[0]!;

  redirect(`/student-portal/courses/${courseId}/lessons/${target.video.id}`);
}
