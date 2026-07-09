import { notFound } from "next/navigation";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { LinkButton } from "@/components/common/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const userRepository = new PrismaUserRepository();
const courseRepository = new PrismaCourseRepository();
const levelRepository = new PrismaLevelRepository();

type PageProps = {
  readonly params: Promise<{ teacherId: string }>;
};

export default async function TeacherBookingPage({ params }: PageProps) {
  const { teacherId } = await params;
  const teacher = await userRepository.findById(teacherId);

  if (!teacher || teacher.role !== "TEACHER") notFound();

  const [courses, levels] = await Promise.all([
    listCoursesForTeacher({ courseRepository }, teacherId),
    listLevels({ levelRepository }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{teacher.name}</h1>
        {teacher.bio ? (
          <p className="mt-2 text-base text-muted-foreground">{teacher.bio}</p>
        ) : null}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium">Courses</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This teacher has no published courses yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((course) => {
              const levelName = levels.find((level) => level.id === course.levelId)?.name ?? "—";
              return (
                <Card key={course.id} className="border">
                  <CardContent className="p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-base font-medium">{course.title}</span>
                      <Badge variant="secondary">{levelName}</Badge>
                      <Badge variant="outline">
                        {course.sessionType === "ONLINE" ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    {course.description ? (
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <LinkButton href="/register">Sign up to enroll</LinkButton>
      </div>
    </div>
  );
}
