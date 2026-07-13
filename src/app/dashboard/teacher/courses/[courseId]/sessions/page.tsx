import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { listClassSessionsForCourse } from "@/modules/scheduling/application/list-class-sessions-for-course";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { SessionRow } from "@/modules/scheduling/presentation/session-row";
import { AddSessionModal } from "@/modules/scheduling/presentation/add-session-modal";
import { BulkAddSessionsModal } from "@/modules/scheduling/presentation/bulk-add-sessions-modal";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSessionAction, deleteSessionAction, bulkCreateSessionsAction } from "./actions";
import { Clock } from "lucide-react";
import type { ClassSession } from "@/modules/scheduling/domain/class-session";
import type { Semester } from "@/modules/semesters/domain/semester";

const classSessionRepository = new PrismaClassSessionRepository();
const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string }>;
};

type SemesterGroup = {
  semester: Semester;
  sessions: ClassSession[];
};

function groupBySemester(
  sessions: ClassSession[],
  semesters: Semester[],
): { groups: SemesterGroup[]; ungrouped: ClassSession[] } {
  const semMap = new Map(semesters.map((s) => [s.id, s]));
  const groupMap = new Map<string, ClassSession[]>();
  const ungrouped: ClassSession[] = [];

  for (const s of sessions) {
    if (semMap.has(s.semesterId)) {
      const bucket = groupMap.get(s.semesterId);
      if (bucket) {
        bucket.push(s);
      } else {
        groupMap.set(s.semesterId, [s]);
      }
    } else {
      ungrouped.push(s);
    }
  }

  // Preserve semester order (by startDate)
  const groups: SemesterGroup[] = semesters
    .filter((sem) => groupMap.has(sem.id))
    .map((sem) => ({ semester: sem, sessions: groupMap.get(sem.id) ?? [] }));

  return { groups, ungrouped };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function CourseSessionsPage({ params }: PageProps) {
  const { courseId } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations("sessions")]);
  const course = await courseRepository.findById(courseId);

  if (!course) notFound();
  if (session?.user.role !== "ADMIN" && course.teacherId !== session?.user.id) notFound();

  const [sessions, semesters] = await Promise.all([
    listClassSessionsForCourse({ classSessionRepository }, courseId),
    listSemestersForCourse({ semesterRepository }, courseId),
  ]);

  const serializedSemesters = semesters.map((s) => ({
    id: s.id,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
  }));

  const boundDelete = deleteSessionAction.bind(null, courseId);
  const { groups, ungrouped } = groupBySemester(sessions, semesters);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {t("pageTitle")} — {course.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {semesters.length === 0
                ? "Create a semester first to add sessions."
                : "Schedule class meeting times for this course."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BulkAddSessionsModal
            courseId={courseId}
            semesters={serializedSemesters}
            bulkCreateAction={bulkCreateSessionsAction}
          />
          <AddSessionModal
            createAction={createSessionAction}
            courseId={courseId}
            semesters={serializedSemesters}
          />
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("noSessions")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Sessions grouped by semester */}
          {groups.map(({ semester, sessions: semSessions }) => (
            <Card key={semester.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span>{fmtDate(semester.startDate)} — {fmtDate(semester.endDate)}</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {semSessions.length} session{semSessions.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {semSessions.map((classSession) => (
                    <SessionRow
                      key={classSession.id}
                      session={classSession}
                      deleteAction={boundDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Ungrouped (legacy sessions without valid semesterId) */}
          {ungrouped.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-muted-foreground">
                  Other sessions
                  <Badge variant="outline" className="ms-2 text-xs font-normal">
                    {ungrouped.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {ungrouped.map((classSession) => (
                    <SessionRow
                      key={classSession.id}
                      session={classSession}
                      deleteAction={boundDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
