import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { listChildrenForParent } from "@/modules/family/application/list-children-for-parent";
import { PrismaParentLinkRepository } from "@/modules/family/infrastructure/prisma-parent-link-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { getStudentCourseSummaries } from "@/modules/roster/application/get-student-course-summaries";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { PrismaAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-attendance-repository";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { CourseSummaryList } from "@/modules/roster/presentation/course-summary-list";
import { Card, CardContent } from "@/components/ui/card";

const parentLinkRepository = new PrismaParentLinkRepository();
const userRepository = new PrismaUserRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();
const classSessionRepository = new PrismaClassSessionRepository();
const attendanceRepository = new PrismaAttendanceRepository();
const paymentRepository = new PrismaPaymentRepository();

export default async function ParentDashboardPage() {
  const session = await auth();
  const parentId = session?.user.id ?? "";
  const t = await getTranslations("dashboard");

  const links = await listChildrenForParent({ parentLinkRepository }, parentId);

  const children = await Promise.all(
    links.map(async (link) => {
      const student = await userRepository.findById(link.studentId);
      const courses = await getStudentCourseSummaries(
        {
          enrollmentRepository,
          semesterRepository,
          courseRepository,
          classSessionRepository,
          attendanceRepository,
          paymentRepository,
        },
        link.studentId,
      );
      return { studentId: link.studentId, studentName: student?.name ?? link.studentId, courses };
    }),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{t("parentTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("parentTagline")}</p>
      </div>

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noChildrenLinked")}</p>
      ) : (
        children.map((child) => (
          <Card key={child.studentId}>
            <CardContent className="p-6">
              <p className="mb-4 font-medium">{child.studentName}</p>
              <CourseSummaryList courses={child.courses} emptyMessage={t("childNotEnrolled")} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
