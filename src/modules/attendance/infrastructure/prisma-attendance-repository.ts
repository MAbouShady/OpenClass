import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  AttendanceRepository,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "@/modules/attendance/domain/attendance-repository";
import type { Attendance } from "@/modules/attendance/domain/attendance";

export class PrismaAttendanceRepository implements AttendanceRepository {
  async findById(id: string): Promise<Attendance | null> {
    return prisma.attendance.findUnique({ where: { id } });
  }

  async findByStudentAndSession(studentId: string, sessionId: string): Promise<Attendance | null> {
    return prisma.attendance.findUnique({
      where: { studentId_sessionId: { studentId, sessionId } },
    });
  }

  async findBySession(sessionId: string): Promise<Attendance[]> {
    return prisma.attendance.findMany({ where: { sessionId } });
  }

  async create(input: CreateAttendanceInput): Promise<Attendance> {
    return prisma.attendance.create({ data: input });
  }

  async update(id: string, input: UpdateAttendanceInput): Promise<Attendance> {
    return prisma.attendance.update({ where: { id }, data: input });
  }
}
