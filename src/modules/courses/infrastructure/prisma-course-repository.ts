import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CourseRepository,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/modules/courses/domain/course-repository";
import type { Course } from "@/modules/courses/domain/course";

export class PrismaCourseRepository implements CourseRepository {
  async findById(id: string): Promise<Course | null> {
    return prisma.course.findUnique({ where: { id } });
  }

  async findByTeacher(teacherId: string): Promise<Course[]> {
    return prisma.course.findMany({ where: { teacherId }, orderBy: { createdAt: "desc" } });
  }

  async findAll(): Promise<Course[]> {
    return prisma.course.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(input: CreateCourseInput): Promise<Course> {
    return prisma.course.create({ data: input });
  }

  async update(id: string, input: UpdateCourseInput): Promise<Course> {
    return prisma.course.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.course.delete({ where: { id } });
  }
}
