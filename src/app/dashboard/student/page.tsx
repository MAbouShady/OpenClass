import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getStudentCourseSummaries } from "@/modules/roster/application/get-student-course-summaries";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { PrismaAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-attendance-repository";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { CourseSummaryList } from "@/modules/roster/presentation/course-summary-list";
import { Card, CardContent } from "@/components/ui/card";

const enrollmentRepository = new PrismaEnrollmentRepository();
const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();
const classSessionRepository = new PrismaClassSessionRepository();
const attendanceRepository = new PrismaAttendanceRepository();
const paymentRepository = new PrismaPaymentRepository();

export default async function StudentDashboardPage() {
  const session = await auth();
  const studentId = session?.user.id ?? "";
  const t = await getTranslations("dashboard");

  const courses = await getStudentCourseSummaries(
    {
      enrollmentRepository,
      semesterRepository,
      courseRepository,
      classSessionRepository,
      attendanceRepository,
      paymentRepository,
    },
    studentId,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{t("studentTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("signedInAs", { email: session?.user.email ?? "" })}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CourseSummaryList courses={courses} emptyMessage={t("noCoursesYet")} />
        </CardContent>
      </Card>
    </div>
  );
}
