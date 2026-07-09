import QRCode from "qrcode";
import { auth } from "@/auth";
import { listEnrollmentsForStudent } from "@/modules/enrollments/application/list-enrollments-for-student";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { generateQrToken } from "@/modules/qr/domain/qr-token";
import { QrCodeImage } from "@/modules/qr/presentation/qr-code-image";
import { Card, CardContent } from "@/components/ui/card";

const enrollmentRepository = new PrismaEnrollmentRepository();
const semesterRepository = new PrismaSemesterRepository();
const courseRepository = new PrismaCourseRepository();

export default async function StudentQrCodesPage() {
  const session = await auth();
  const studentId = session?.user.id ?? "";

  const enrollments = await listEnrollmentsForStudent({ enrollmentRepository }, studentId);

  const courseIds = new Set<string>();
  const cards: { courseId: string; courseTitle: string; dataUrl: string }[] = [];

  for (const enrollment of enrollments) {
    const semester = await semesterRepository.findById(enrollment.semesterId);
    if (!semester || courseIds.has(semester.courseId)) continue;

    const course = await courseRepository.findById(semester.courseId);
    if (!course) continue;

    courseIds.add(course.id);
    const token = generateQrToken({ studentId, courseId: course.id, teacherId: course.teacherId });
    const dataUrl = await QRCode.toDataURL(token, { width: 200 });
    cards.push({ courseId: course.id, courseTitle: course.title, dataUrl });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">My QR codes</h1>
        <p className="text-sm text-muted-foreground">
          Show this code to your teacher to check in and out of offline sessions.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">Enroll in a course to get your QR code.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <Card key={card.courseId}>
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <span className="font-medium">{card.courseTitle}</span>
                <QrCodeImage dataUrl={card.dataUrl} label={card.courseTitle} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
