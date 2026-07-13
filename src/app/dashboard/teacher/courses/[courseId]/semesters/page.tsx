import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { SemesterRow } from "@/modules/semesters/presentation/semester-row";
import { AddSemesterModal } from "@/modules/semesters/presentation/add-semester-modal";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSemesterAction, deleteSemesterAction } from "./actions";
import { CalendarDays } from "lucide-react";

const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string }>;
};

export default async function CourseSemestersPage({ params }: PageProps) {
  const { courseId } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations("semesters")]);
  const course = await courseRepository.findById(courseId);

  if (!course) notFound();
  if (session?.user.role !== "ADMIN" && course.teacherId !== session?.user.id) notFound();

  const semesters = await listSemestersForCourse({ semesterRepository }, courseId);
  const boundDelete = deleteSemesterAction.bind(null, courseId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {t("pageTitle")} — {course.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Create enrollment periods students can book into.
            </p>
          </div>
        </div>
        <AddSemesterModal createAction={createSemesterAction} courseId={courseId} />
      </div>

      {/* Semesters list */}
      <Card>
        <CardHeader>
          <CardTitle>{t("existingSemesters")}</CardTitle>
        </CardHeader>
        <CardContent>
          {semesters.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noSemesters")}</p>
          ) : (
            <div className="divide-y">
              {semesters.map((semester) => (
                <SemesterRow key={semester.id} semester={semester} deleteAction={boundDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
