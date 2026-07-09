import type { ClassSession } from "@/modules/scheduling/domain/class-session";
import type {
  ClassSessionRepository,
  CreateClassSessionInput,
} from "@/modules/scheduling/domain/class-session-repository";

export class FakeClassSessionRepository implements ClassSessionRepository {
  private sessions: ClassSession[];
  private nextId = 1;

  constructor(seed: ClassSession[] = []) {
    this.sessions = seed;
  }

  async findById(id: string): Promise<ClassSession | null> {
    return this.sessions.find((session) => session.id === id) ?? null;
  }

  async findByCourse(courseId: string): Promise<ClassSession[]> {
    return this.sessions.filter((session) => session.courseId === courseId);
  }

  async create(input: CreateClassSessionInput): Promise<ClassSession> {
    const session: ClassSession = { id: `session-${this.nextId++}`, ...input };
    this.sessions.push(session);
    return session;
  }

  async delete(id: string): Promise<void> {
    this.sessions = this.sessions.filter((session) => session.id !== id);
  }
}
