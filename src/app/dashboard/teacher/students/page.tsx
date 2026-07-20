import { auth } from "@/auth";
import { listStudentsForTeacher } from "@/modules/students/application/list-students-for-teacher";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { AddStudentModal } from "@/modules/students/presentation/add-student-modal";
import { StudentSearchList } from "@/modules/students/presentation/student-search-list";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  enrollStudentAction,
} from "@/app/dashboard/teacher/students/actions";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";

const studentRepository = new PrismaStudentRepository();
const levelRepository = new PrismaLevelRepository();
const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();

export default async function TeacherStudentsPage() {
  const session = await auth();
  const teacherId = session?.user.id ?? "";

  const [students, levels, courses, t] = await Promise.all([
    listStudentsForTeacher({ studentRepository }, teacherId),
    listLevels({ levelRepository }),
    listCoursesForTeacher({ courseRepository }, teacherId),
    getTranslations("students"),
  ]);

  const parents = await studentRepository.findAllParents();

  const allSemesters = await Promise.all(
    courses.map((c) => listSemestersForCourse({ semesterRepository }, c.id)),
  );
  const semestersByCourse = new Map(courses.map((c, i) => [c.id, allSemesters[i]!]));

  const courseOptions = courses.map((c) => {
    const semesters = semestersByCourse.get(c.id) ?? [];
    const latest = semesters.slice().sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0];
    return { id: c.id, title: c.title, latestSemesterId: latest?.id ?? null };
  });

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <AddStudentModal
          createAction={createStudentAction}
          levels={levels}
          parents={parents}
          courseOptions={courseOptions}
        />
      </div>

      <Card>
        <CardContent className="px-6 py-4">
          <StudentSearchList
            students={students}
            levels={levels}
            parents={parents}
            courseOptions={courseOptions}
            updateAction={updateStudentAction}
            enrollAction={enrollStudentAction}
            deleteAction={deleteStudentAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
