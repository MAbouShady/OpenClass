import type { ClassSession } from "@/modules/scheduling/domain/class-session";

export type CreateClassSessionInput = {
  readonly courseId: string;
  readonly startTime: Date;
  readonly endTime: Date;
};

export interface ClassSessionRepository {
  findById(id: string): Promise<ClassSession | null>;
  findByCourse(courseId: string): Promise<ClassSession[]>;
  create(input: CreateClassSessionInput): Promise<ClassSession>;
  delete(id: string): Promise<void>;
}
