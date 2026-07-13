import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { EnrollmentPaymentRow } from "@/modules/payments/presentation/enrollment-payment-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approvePaymentAction, markCashPaymentAction } from "./actions";

const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const studentRepository = new PrismaStudentRepository();
const paymentRepository = new PrismaPaymentRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string }>;
};

export default async function CoursePaymentsPage({ params }: PageProps) {
  const { courseId } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations("payments")]);
  const course = await courseRepository.findById(courseId);

  if (!course) notFound();
  if (session?.user.role !== "ADMIN" && course.teacherId !== session?.user.id) notFound();

  const currentMonth = normalizeToMonthStart(new Date());
  const monthIso = currentMonth.toISOString();
  const semesters = await listSemestersForCourse({ semesterRepository }, courseId);

  const rows = (
    await Promise.all(
      semesters.map(async (semester) => {
        const enrollments = await enrollmentRepository.findBySemester(semester.id);
        return Promise.all(
          enrollments.map(async (enrollment) => {
            const student = await studentRepository.findById(enrollment.studentId);
            const payment = await paymentRepository.findByEnrollmentAndMonth(
              enrollment.id,
              currentMonth,
            );
            return {
              enrollmentId: enrollment.id,
              studentName: student?.name ?? enrollment.studentId,
              studentIdNumber: student?.idNumber ?? null,
              status: payment?.status ?? ("UNPAID" as const),
              pendingPaymentId: payment?.status === "PENDING" ? payment.id : null,
            };
          }),
        );
      }),
    )
  ).flat();

  const boundApprove = approvePaymentAction.bind(null, courseId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")} — {course.title}</h1>
        <p className="text-muted-foreground">
          {t("currentMonth")}:{" "}
          {new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(currentMonth)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("enrollmentPayments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noStudents")}</p>
          ) : (
            <div>
              {rows.map((row) => (
                <EnrollmentPaymentRow
                  key={row.enrollmentId}
                  studentName={row.studentName}
                  studentIdNumber={row.studentIdNumber}
                  status={row.status}
                  pendingPaymentId={row.pendingPaymentId}
                  markCashAction={markCashPaymentAction.bind(
                    null,
                    courseId,
                    row.enrollmentId,
                    monthIso,
                  )}
                  approveAction={boundApprove}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
