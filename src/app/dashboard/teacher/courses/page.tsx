import { PageHeader } from "@/components/common/page-header";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { CourseListWithFilter } from "@/modules/courses/presentation/course-list-with-filter";
import { AddCourseModal } from "@/modules/courses/presentation/add-course-modal";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import {
  createCourseAction,
  deleteCourseAction,
  updateCourseAction,
} from "@/app/dashboard/teacher/courses/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen } from "lucide-react";
import { PrismaCourseStudentCountsReader } from "@/modules/payments/infrastructure/prisma-course-student-counts-reader";

const courseRepository = new PrismaCourseRepository();
const courseStudentCounts = new PrismaCourseStudentCountsReader();
const levelRepository = new PrismaLevelRepository();

export default async function TeacherCoursesPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("courses")]);
  const teacherId = session?.user.id ?? "";

  const [courses, levels, counts] = await Promise.all([
    listCoursesForTeacher({ courseRepository }, teacherId),
    listLevels({ levelRepository }, teacherId),
    courseStudentCounts.forTeacher(teacherId, new Date()),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page header */}
      <PageHeader
        icon={<BookOpen className="h-5 w-5" />}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        tone="violet"
        actions={<AddCourseModal createAction={createCourseAction} levels={levels} />}
      />

      {levels.length === 0 && (
        <Alert>
          <AlertDescription>{t("noLevelsWarning")}</AlertDescription>
        </Alert>
      )}

      {/* Courses grid */}
      <CourseListWithFilter
        courses={courses}
        counts={Object.fromEntries(counts)}
        levels={levels}
        teacherId={teacherId}
        updateAction={updateCourseAction}
        deleteAction={deleteCourseAction}
        noCoursesLabel={t("noCourses")}
      />
    </div>
  );
}
