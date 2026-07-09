import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { SemesterForm } from "@/modules/semesters/presentation/semester-form";
import { SemesterRow } from "@/modules/semesters/presentation/semester-row";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSemesterAction, deleteSemesterAction } from "./actions";

const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string }>;
};

export default async function CourseSemestersPage({ params }: PageProps) {
  const { courseId } = await params;
  const session = await auth();
  const course = await courseRepository.findById(courseId);

  if (!course) notFound();
  if (session?.user.role !== "ADMIN" && course.teacherId !== session?.user.id) notFound();

  const semesters = await listSemestersForCourse({ semesterRepository }, courseId);
  const boundDelete = deleteSemesterAction.bind(null, courseId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Semesters — {course.title}</h1>
        <p className="text-muted-foreground">Create enrollment periods students can book into.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a semester</CardTitle>
        </CardHeader>
        <CardContent>
          <SemesterForm action={createSemesterAction} courseId={courseId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing semesters</CardTitle>
        </CardHeader>
        <CardContent>
          {semesters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No semesters yet.</p>
          ) : (
            <div>
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
