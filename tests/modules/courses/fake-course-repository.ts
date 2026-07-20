import type { Course } from "@/modules/courses/domain/course";
import type {
  CourseRepository,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/modules/courses/domain/course-repository";

export class FakeCourseRepository implements CourseRepository {
  private courses: Course[];
  private nextId = 1;

  constructor(seed: Course[] = []) {
    this.courses = seed;
  }

  async findById(id: string): Promise<Course | null> {
    return this.courses.find((course) => course.id === id) ?? null;
  }

  async findByTeacher(teacherId: string): Promise<Course[]> {
    return this.courses.filter((course) => course.teacherId === teacherId);
  }

  async findActiveByTeacher(teacherId: string): Promise<Course[]> {
    return this.courses.filter((course) => course.teacherId === teacherId && course.isActive);
  }

  async findAll(): Promise<Course[]> {
    return this.courses;
  }

  async create(input: CreateCourseInput): Promise<Course> {
    const course: Course = { id: `course-${this.nextId++}`, isActive: true, ...input };
    this.courses.push(course);
    return course;
  }

  async update(id: string, input: UpdateCourseInput): Promise<Course> {
    const index = this.courses.findIndex((course) => course.id === id);
    const existing = this.courses[index];
    if (index === -1 || !existing) throw new Error("not found");
    const updated: Course = { ...existing, ...input };
    this.courses[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.courses = this.courses.filter((course) => course.id !== id);
  }
}
