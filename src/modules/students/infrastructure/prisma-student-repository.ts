import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateStudentInput,
  ParentOption,
  StudentRepository,
  UpdateStudentInput,
} from "@/modules/students/domain/student-repository";
import type { Student, StudentWithCourses } from "@/modules/students/domain/student";

async function generateUniqueIdNumber(): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const candidate = 100000 + Math.floor(Math.random() * 900000);
    const exists = await prisma.user.findFirst({ where: { idNumber: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique student ID after 20 attempts.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStudent(row: any, parentLink?: any): Student {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    idNumber: (row.idNumber as number | null) ?? null,
    levelId: (row.levelId as string | null) ?? null,
    levelName: (row.level?.name as string | null) ?? null,
    parentId: (parentLink?.parentId as string | null) ?? null,
    parentName: (parentLink?.parent?.name as string | null) ?? null,
    parentEmail: (parentLink?.parent?.email as string | null) ?? null,
  };
}

export class PrismaStudentRepository implements StudentRepository {
  async findByTeacher(teacherId: string): Promise<StudentWithCourses[]> {
    // Primary source: direct teacher-student links
    const links = await prisma.teacherStudent.findMany({
      where: { teacherId, student: { role: "STUDENT" } },
      include: {
        student: {
          include: {
            level: { select: { name: true } },
            parentLinks: {
              include: { parent: { select: { id: true, name: true, email: true } } },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (links.length === 0) return [];

    // Fetch enrollment data for enrolled courses
    const courses = await prisma.course.findMany({
      where: { teacherId },
      select: { id: true, title: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c.title]));
    const studentIds = links.map((l) => l.studentId);

    const enrollments =
      courses.length > 0
        ? await prisma.enrollment.findMany({
            where: {
              semester: { courseId: { in: Array.from(courseMap.keys()) } },
              studentId: { in: studentIds },
            },
            include: {
              semester: { select: { id: true, courseId: true, startDate: true, endDate: true } },
            },
          })
        : [];

    const enrollmentsByStudent = new Map<string, typeof enrollments>();
    for (const e of enrollments) {
      if (!enrollmentsByStudent.has(e.studentId)) enrollmentsByStudent.set(e.studentId, []);
      enrollmentsByStudent.get(e.studentId)!.push(e);
    }

    return links.map(({ student }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = student as any;
      const studentEnrollments = enrollmentsByStudent.get(s.id) ?? [];
      const seen = new Set<string>();
      const enrolledCourses = studentEnrollments
        .filter((e) => {
          if (seen.has(e.semester.courseId)) return false;
          seen.add(e.semester.courseId);
          return true;
        })
        .map((e) => ({
          courseId: e.semester.courseId,
          courseTitle: courseMap.get(e.semester.courseId) ?? "",
          semesterId: e.semester.id,
          semesterStart: e.semester.startDate.toISOString(),
          semesterEnd: e.semester.endDate.toISOString(),
        }));
      return { ...toStudent(s, s.parentLinks?.[0]), enrolledCourses };
    });
  }

  async findByIdNumber(idNumber: number): Promise<Student | null> {
    const row = await prisma.user.findUnique({
      where: { idNumber },
      include: {
        level: { select: { name: true } },
        parentLinks: {
          include: { parent: { select: { id: true, name: true, email: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!row) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toStudent(row as any, (row as any).parentLinks?.[0]);
  }

  async findByPhone(phone: string): Promise<Student | null> {
    const row = await prisma.user.findFirst({
      where: { phone },
      include: {
        level: { select: { name: true } },
        parentLinks: {
          include: { parent: { select: { id: true, name: true, email: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!row) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toStudent(row as any, (row as any).parentLinks?.[0]);
  }

  async findByEmail(email: string): Promise<Student | null> {
    const row = await prisma.user.findUnique({
      where: { email },
      include: {
        level: { select: { name: true } },
        parentLinks: {
          include: { parent: { select: { id: true, name: true, email: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!row) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toStudent(row as any, (row as any).parentLinks?.[0]);
  }

  async isLinkedToTeacher(studentId: string, teacherId: string): Promise<boolean> {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
    });
    return link !== null;
  }

  async linkToTeacher(studentId: string, teacherId: string): Promise<void> {
    await prisma.teacherStudent.upsert({
      where: { teacherId_studentId: { teacherId, studentId } },
      create: { teacherId, studentId },
      update: {},
    });
  }

  async assignIdNumberIfMissing(studentId: string): Promise<number> {
    const row = await prisma.user.findUnique({ where: { id: studentId }, select: { idNumber: true } });
    if (row?.idNumber !== null && row?.idNumber !== undefined) return row.idNumber;
    const nextId = await generateUniqueIdNumber();
    await prisma.user.update({ where: { id: studentId }, data: { idNumber: nextId } as never });
    return nextId;
  }

  async findById(id: string): Promise<StudentWithCourses | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      include: {
        level: { select: { name: true } },
        parentLinks: {
          include: { parent: { select: { id: true, name: true, email: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!row) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...toStudent(row as any, (row as any).parentLinks?.[0]), enrolledCourses: [] };
  }

  async findAllParents(): Promise<ParentOption[]> {
    return prisma.user.findMany({
      where: { role: "PARENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }) as Promise<ParentOption[]>;
  }

  async create(input: CreateStudentInput): Promise<Student> {
    const nextId = await generateUniqueIdNumber();
    const row = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email ?? null,
        passwordHash: input.passwordHash,
        role: "STUDENT",
        locale: "en",
        phone: input.phone,
        idNumber: input.idNumber ?? nextId,
        levelId: input.levelId,
      } as never,
      include: { level: { select: { name: true } } },
    });

    // Link to teacher
    await prisma.teacherStudent.create({
      data: { teacherId: input.teacherId, studentId: row.id },
    });

    // Enroll in selected semesters
    if (input.semesterIds.length > 0) {
      await this.enrollInSemesters(row.id, input.semesterIds);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toStudent(row as any);
  }

  async update(id: string, input: UpdateStudentInput): Promise<Student> {
    const row = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone,
        idNumber: input.idNumber,
        levelId: input.levelId,
      } as never,
      include: { level: { select: { name: true } } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toStudent(row as any);
  }

  async setParent(studentId: string, parentId: string | null): Promise<void> {
    await prisma.parentStudent.deleteMany({ where: { studentId } });
    if (parentId) {
      await prisma.parentStudent.create({ data: { studentId, parentId } });
    }
  }

  async enrollInSemesters(studentId: string, semesterIds: readonly string[]): Promise<void> {
    for (const semesterId of semesterIds) {
      const exists = await prisma.enrollment.findFirst({ where: { studentId, semesterId } });
      if (!exists) {
        await prisma.enrollment.create({ data: { studentId, semesterId } });
      }
    }
  }

  async unenrollFromSemester(enrollmentId: string): Promise<void> {
    await prisma.payment.deleteMany({ where: { enrollmentId } });
    await prisma.enrollment.delete({ where: { id: enrollmentId } });
  }

  async delete(id: string): Promise<void> {
    const teacherCourses = await prisma.course.findMany({ where: { teacherId: id }, select: { title: true } });
    if (teacherCourses.length > 0) {
      const titles = teacherCourses.map((c) => c.title).join("، ");
      throw new Error(`لا يمكن حذفه — لا زال مدرّسًا في: ${titles}`);
    }
    await prisma.$transaction(async (tx) => {
      const enrollmentIds = (
        await tx.enrollment.findMany({ where: { studentId: id }, select: { id: true } })
      ).map((e) => e.id);
      await tx.payment.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.enrollment.deleteMany({ where: { studentId: id } });
      await tx.parentStudent.deleteMany({ where: { OR: [{ studentId: id }, { parentId: id }] } });
      await tx.teacherStudent.deleteMany({ where: { OR: [{ studentId: id }, { teacherId: id }] } });
      await tx.user.delete({ where: { id } });
    });
  }
}
