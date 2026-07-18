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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen } from "lucide-react";

const courseRepository = new PrismaCourseRepository();
const levelRepository = new PrismaLevelRepository();

export default async function TeacherCoursesPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("courses")]);
  const teacherId = session?.user.id ?? "";

  const [courses, levels] = await Promise.all([
    listCoursesForTeacher({ courseRepository }, teacherId),
    listLevels({ levelRepository }, teacherId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
        <AddCourseModal createAction={createCourseAction} levels={levels} />
      </div>

      {levels.length === 0 && (
        <Alert>
          <AlertDescription>{t("noLevelsWarning")}</AlertDescription>
        </Alert>
      )}

      {/* Courses list */}
      <Card>
        <CardHeader>
          <CardTitle>{t("existingCourses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseListWithFilter
            courses={courses}
            levels={levels}
            updateAction={updateCourseAction}
            deleteAction={deleteCourseAction}
            noCoursesLabel={t("noCourses")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
