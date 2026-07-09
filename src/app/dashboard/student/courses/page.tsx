import { auth } from "@/auth";
import { listAllCourses } from "@/modules/courses/application/list-all-courses";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { listEnrollmentsForStudent } from "@/modules/enrollments/application/list-enrollments-for-student";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { EnrollButton } from "@/modules/enrollments/presentation/enroll-button";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PaymentStatusChip } from "@/modules/payments/presentation/payment-status-chip";
import { SubmitPaymentForm } from "@/modules/payments/presentation/submit-payment-form";
import { enrollAction, submitPaymentAction } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const courseRepository = new PrismaCourseRepository();
const levelRepository = new PrismaLevelRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const paymentRepository = new PrismaPaymentRepository();

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export default async function StudentCoursesPage() {
  const session = await auth();
  const studentId = session?.user.id ?? "";
  const currentMonth = normalizeToMonthStart(new Date());

  const [courses, levels, enrollments] = await Promise.all([
    listAllCourses({ courseRepository }),
    listLevels({ levelRepository }),
    listEnrollmentsForStudent({ enrollmentRepository }, studentId),
  ]);

  const enrollmentBySemesterId = new Map(
    enrollments.map((enrollment) => [enrollment.semesterId, enrollment]),
  );

  const coursesWithSemesters = await Promise.all(
    courses.map(async (course) => {
      const semesters = await listSemestersForCourse({ semesterRepository }, course.id);
      const semesterRows = await Promise.all(
        semesters.map(async (semester) => {
          const enrollment = enrollmentBySemesterId.get(semester.id);
          const payment = enrollment
            ? await paymentRepository.findByEnrollmentAndMonth(enrollment.id, currentMonth)
            : null;
          return { semester, enrollment, payment };
        }),
      );
      return { course, semesterRows };
    }),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Browse courses</h1>
        <p className="text-sm text-muted-foreground">Enroll in a semester to join a course.</p>
      </div>

      {coursesWithSemesters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses available yet.</p>
      ) : (
        coursesWithSemesters.map(({ course, semesterRows }) => {
          const levelName = levels.find((level) => level.id === course.levelId)?.name ?? "—";

          return (
            <Card key={course.id}>
              <CardContent className="pt-6">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{course.title}</span>
                  <Badge variant="secondary">{levelName}</Badge>
                  <Badge variant="secondary">
                    {course.sessionType === "ONLINE" ? "Online" : "Offline"}
                  </Badge>
                </div>

                {course.description ? (
                  <p className="mb-4 text-sm text-muted-foreground">{course.description}</p>
                ) : null}

                {semesterRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No semesters open for enrollment yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {semesterRows.map(({ semester, enrollment, payment }) => (
                      <div key={semester.id}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                          </span>
                          {enrollment ? (
                            <PaymentStatusChip status={payment?.status ?? "UNPAID"} />
                          ) : (
                            <EnrollButton
                              semesterId={semester.id}
                              enrolled={false}
                              action={enrollAction}
                            />
                          )}
                        </div>
                        {enrollment && !payment ? (
                          <SubmitPaymentForm
                            action={submitPaymentAction.bind(null, enrollment.id)}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
