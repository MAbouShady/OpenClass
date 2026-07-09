import type { Attendance } from "@/modules/attendance/domain/attendance";
import type {
  AttendanceRepository,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "@/modules/attendance/domain/attendance-repository";

export class FakeAttendanceRepository implements AttendanceRepository {
  private records: Attendance[];
  private nextId = 1;

  constructor(seed: Attendance[] = []) {
    this.records = seed;
  }

  async findById(id: string): Promise<Attendance | null> {
    return this.records.find((record) => record.id === id) ?? null;
  }

  async findByStudentAndSession(studentId: string, sessionId: string): Promise<Attendance | null> {
    return (
      this.records.find(
        (record) => record.studentId === studentId && record.sessionId === sessionId,
      ) ?? null
    );
  }

  async findBySession(sessionId: string): Promise<Attendance[]> {
    return this.records.filter((record) => record.sessionId === sessionId);
  }

  async create(input: CreateAttendanceInput): Promise<Attendance> {
    const record: Attendance = { id: `attendance-${this.nextId++}`, ...input };
    this.records.push(record);
    return record;
  }

  async update(id: string, input: UpdateAttendanceInput): Promise<Attendance> {
    const index = this.records.findIndex((record) => record.id === id);
    const existing = this.records[index];
    if (index === -1 || !existing) throw new Error("not found");
    const updated: Attendance = { ...existing, ...input };
    this.records[index] = updated;
    return updated;
  }
}
