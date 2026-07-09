import { z } from "zod";
import { ATTENDANCE_STATUSES } from "@/modules/attendance/domain/attendance";

export const manualMarkAttendanceSchema = z.object({
  studentId: z.string().min(1),
  sessionId: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUSES),
});

export type ManualMarkAttendanceSchemaInput = z.infer<typeof manualMarkAttendanceSchema>;
