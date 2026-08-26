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
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { BookOpen, CreditCard, LayoutDashboard, Users } from "lucide-react";

const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const paymentRepository = new PrismaPaymentRepository();

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
        if (course.paymentFrequency !== "MONTHLY") continue;
        const payment = await paymentRepository.findByEnrollmentAndMonth(
          enrollment.id,
          currentMonth,
        );
        if (!payment || payment.status !== "APPROVED") pendingPayments += 1;
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title={t("teacherTitle")}
        subtitle={t("signedInAs", { email: session?.user.email ?? "" })}
        tone="violet"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("statCourses")}
          value={courses.length}
          icon={<BookOpen className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label={t("statStudents")}
          value={studentIds.size}
          icon={<Users className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label={t("statPendingPayments")}
          value={pendingPayments}
          icon={<CreditCard className="h-5 w-5" />}
          tone="amber"
          emphasis
        />
      </div>

      <div className="flex flex-wrap gap-3">
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
