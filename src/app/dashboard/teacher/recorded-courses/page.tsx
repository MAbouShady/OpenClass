import { PageHeader } from "@/components/common/page-header";
import { getTranslations } from "next-intl/server";
import { Video } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllCourses } from "@/modules/courses/application/list-all-courses";
import { listManageableRecordedVideos } from "@/modules/recordings/application/list-recorded-videos";
import { canManageCourse } from "@/modules/recordings/application/actor";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveRecordingActor } from "@/modules/recordings/infrastructure/recording-actor";
import { AddRecordedVideoModal } from "@/modules/recordings/presentation/add-recorded-video-modal";
import { RecordedVideoList } from "@/modules/recordings/presentation/recorded-video-list";
import { toRecordedVideoItem } from "@/modules/recordings/presentation/recorded-video-item";
import {
  createRecordedVideoAction,
  deleteRecordedVideoAction,
  retryVideoProcessingAction,
  setRecordedVideoStatusAction,
  updateRecordedVideoAction,
} from "@/app/dashboard/teacher/recorded-courses/actions";

/** Video processing state changes out of band, so this page is never cached. */
export const dynamic = "force-dynamic";

export default async function RecordedCoursesPage() {
  const [actor, t] = await Promise.all([resolveRecordingActor(), getTranslations("recordings")]);

  if (!actor) {
    return <p className="text-sm text-muted-foreground">{t("signInRequired")}</p>;
  }

  const allCourses = await listAllCourses({ courseRepository: recordings.courseRepository });
  const courses = allCourses
    .filter((course) => canManageCourse(actor, course))
    .map((course) => ({ id: course.id, title: course.title }));

  const videos = await listManageableRecordedVideos(recordings, actor);
  const courseTitleById = new Map(courses.map((course) => [course.id, course.title]));
  const items = videos.map((video) =>
    toRecordedVideoItem(video, courseTitleById.get(video.courseId) ?? "—"),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={<Video className="h-5 w-5" />}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        tone="sky"
        actions={
          <AddRecordedVideoModal createAction={createRecordedVideoAction} courses={courses} />
        }
      />

      {courses.length === 0 ? (
        <Alert>
          <AlertDescription>{t("noCoursesWarning")}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("existingVideos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordedVideoList
            videos={items}
            courses={courses}
            updateAction={updateRecordedVideoAction}
            deleteAction={deleteRecordedVideoAction}
            toggleStatusAction={setRecordedVideoStatusAction}
            retryProcessingAction={retryVideoProcessingAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
