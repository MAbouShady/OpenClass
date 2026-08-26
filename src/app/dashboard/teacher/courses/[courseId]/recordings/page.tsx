import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { getTranslations } from "next-intl/server";
import { ListVideo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canManageCourse } from "@/modules/recordings/application/actor";
import { listRecordedVideosForCourse } from "@/modules/recordings/application/list-recorded-videos";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveRecordingActor } from "@/modules/recordings/infrastructure/recording-actor";
import { AddRecordedVideoModal } from "@/modules/recordings/presentation/add-recorded-video-modal";
import { LessonReorderList } from "@/modules/recordings/presentation/lesson-reorder-list";
import { toRecordedVideoItem } from "@/modules/recordings/presentation/recorded-video-item";
import {
  createRecordedVideoAction,
  deleteRecordedVideoAction,
  reorderRecordedVideosAction,
  updateRecordedVideoAction,
} from "@/app/dashboard/teacher/recorded-courses/actions";

export const dynamic = "force-dynamic";

/** Recorded lessons of one existing course, with drag-and-drop ordering. */
export default async function CourseRecordingsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [actor, t] = await Promise.all([resolveRecordingActor(), getTranslations("recordings")]);
  if (!actor) notFound();

  const course = await recordings.courseRepository.findById(courseId);
  // 404 rather than 403: a manager of another course learns nothing about this one.
  if (!course || !canManageCourse(actor, course)) notFound();

  const videos = await listRecordedVideosForCourse(recordings, courseId);
  const items = videos.map((video) => toRecordedVideoItem(video, course.title));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={<ListVideo className="h-5 w-5" />}
        title={course.title}
        subtitle={t("recordedLessons")}
        tone="sky"
        actions={
          <AddRecordedVideoModal
            createAction={createRecordedVideoAction}
            courses={[{ id: course.id, title: course.title }]}
            lockedCourseId={course.id}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("reorderTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonReorderList
            courseId={courseId}
            videos={items}
            courses={[{ id: course.id, title: course.title }]}
            reorderAction={reorderRecordedVideosAction}
            updateAction={updateRecordedVideoAction}
            deleteAction={deleteRecordedVideoAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
