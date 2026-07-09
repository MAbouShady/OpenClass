import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { LinkButton } from "@/components/common/link-button";
import { Card, CardContent } from "@/components/ui/card";

const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const paymentRepository = new PrismaPaymentRepository();

function StatCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default async function TeacherDashboardPage() {
  const session = await auth();
  const teacherId = session?.user.id ?? "";
  const currentMonth = normalizeToMonthStart(new Date());
  const t = await getTranslations("dashboard");

  const courses = await listCoursesForTeacher({ courseRepository }, teacherId);

  const studentIds = new Set<string>();
  let pendingPayments = 0;

  for (const course of courses) {
    const semesters = await listSemestersForCourse({ semesterRepository }, course.id);
    for (const semester of semesters) {
      const enrollments = await enrollmentRepository.findBySemester(semester.id);
      for (const enrollment of enrollments) {
        studentIds.add(enrollment.studentId);
        const payment = await paymentRepository.findByEnrollmentAndMonth(
          enrollment.id,
          currentMonth,
        );
        if (payment?.status === "PENDING") pendingPayments += 1;
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{t("teacherTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("signedInAs", { email: session?.user.email ?? "" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("statCourses")} value={courses.length} />
        <StatCard label={t("statStudents")} value={studentIds.size} />
        <StatCard label={t("statPendingPayments")} value={pendingPayments} />
      </div>

      <div className="flex gap-3">
        <LinkButton href="/dashboard/teacher/courses" variant="outline">
          {t("manageCourses")}
        </LinkButton>
        <LinkButton href="/dashboard/teacher/students" variant="outline">
          {t("viewStudents")}
        </LinkButton>
      </div>
    </div>
  );
}
