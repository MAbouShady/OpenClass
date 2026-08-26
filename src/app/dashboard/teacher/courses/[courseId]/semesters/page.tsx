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
import { PageHeader } from "@/components/common/page-header";

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
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={<CalendarDays className="h-5 w-5" />}
        title={`${t("pageTitle")} — ${course.title}`}
        subtitle="Create enrollment periods students can book into."
        tone="sky"
        actions={<AddSemesterModal createAction={createSemesterAction} courseId={courseId} />}
      />

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
