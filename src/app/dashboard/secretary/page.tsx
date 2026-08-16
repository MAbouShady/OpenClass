import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/common/link-button";
import { ScanLine } from "lucide-react";

export default async function SecretaryDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "SECRETARY") notFound();

  const t = await getTranslations("secretary");

  const secretaryUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { secretaryOfId: true, secretaryOf: { select: { name: true } } },
  });

  if (!secretaryUser?.secretaryOfId) notFound();

  const teacherId = secretaryUser.secretaryOfId;
  const teacherName = secretaryUser.secretaryOf?.name ?? "";

  const courses = await prisma.course.findMany({
    where: { teacherId, isActive: true },
    include: {
      sessions: {
        orderBy: { startTime: "desc" },
        take: 5,
      },
    },
    orderBy: { title: "asc" },
  });

  const fmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("teacherLabel")}: {teacherName}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("noCourses")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ScanLine className="h-4 w-4 text-muted-foreground" />
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noSessions")}</p>
                ) : (
                  <div className="divide-y">
                    {course.sessions.map((classSession) => (
                      <div
                        key={classSession.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <span className="text-sm text-muted-foreground">
                          {fmt.format(classSession.startTime)}
                        </span>
                        <LinkButton
                          href={`/dashboard/teacher/courses/${course.id}/sessions/${classSession.id}/attendance`}
                          size="sm"
                          variant="outline"
                        >
                          {t("scanBtn")}
                        </LinkButton>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
