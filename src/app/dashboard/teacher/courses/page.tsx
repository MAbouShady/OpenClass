import { auth } from "@/auth";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { CourseForm } from "@/modules/courses/presentation/course-form";
import { CourseRow } from "@/modules/courses/presentation/course-row";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import {
  createCourseAction,
  deleteCourseAction,
  updateCourseAction,
} from "@/app/dashboard/teacher/courses/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const courseRepository = new PrismaCourseRepository();
const levelRepository = new PrismaLevelRepository();

export default async function TeacherCoursesPage() {
  const session = await auth();
  const teacherId = session?.user.id ?? "";

  const [courses, levels] = await Promise.all([
    listCoursesForTeacher({ courseRepository }, teacherId),
    listLevels({ levelRepository }),
  ]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">My courses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create and manage the courses you teach.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Add a course</CardTitle>
        </CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No levels exist yet — ask an admin to create one first.
            </p>
          ) : (
            <CourseForm action={createCourseAction} levels={levels} submitLabel="Add course" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Existing courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          ) : (
            <div>
              {courses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  levels={levels}
                  updateAction={updateCourseAction}
                  deleteAction={deleteCourseAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
