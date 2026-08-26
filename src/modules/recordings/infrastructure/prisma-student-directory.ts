import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  PortalStudent,
  StudentDirectory,
} from "@/modules/recordings/domain/student-directory";

export class PrismaStudentDirectory implements StudentDirectory {
  async findByCode(code: number): Promise<PortalStudent | null> {
    const row = await prisma.user.findUnique({
      where: { idNumber: code },
      select: { id: true, name: true, idNumber: true, role: true },
    });
    if (!row || row.role !== "STUDENT" || row.idNumber === null) return null;
    return { id: row.id, name: row.name, code: row.idNumber };
  }

  async findById(id: string): Promise<PortalStudent | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, idNumber: true, role: true },
    });
    if (!row || row.role !== "STUDENT" || row.idNumber === null) return null;
    return { id: row.id, name: row.name, code: row.idNumber };
  }
}
