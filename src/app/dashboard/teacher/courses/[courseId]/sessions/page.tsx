import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { listClassSessionsForCourse } from "@/modules/scheduling/application/list-class-sessions-for-course";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { SessionForm } from "@/modules/scheduling/presentation/session-form";
import { SessionRow } from "@/modules/scheduling/presentation/session-row";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSessionAction, deleteSessionAction } from "./actions";

const classSessionRepository = new PrismaClassSessionRepository();
const courseRepository = new PrismaCourseRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string }>;
};

export default async function CourseSessionsPage({ params }: PageProps) {
  const { courseId } = await params;
  const session = await auth();
  const course = await courseRepository.findById(courseId);

  if (!course) notFound();
  if (session?.user.role !== "ADMIN" && course.teacherId !== session?.user.id) notFound();

  const sessions = await listClassSessionsForCourse({ classSessionRepository }, courseId);
  const boundDelete = deleteSessionAction.bind(null, courseId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sessions — {course.title}</h1>
        <p className="text-muted-foreground">Schedule class meeting times for this course.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a session</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionForm action={createSessionAction} courseId={courseId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
          ) : (
            <div>
              {sessions.map((classSession) => (
                <SessionRow key={classSession.id} session={classSession} deleteAction={boundDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
