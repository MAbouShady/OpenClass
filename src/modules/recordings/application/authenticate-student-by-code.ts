import { err, ok, type Result } from "@/shared/domain/result";
import { z } from "zod";
import { DomainError } from "@/shared/domain/result";
import type {
  PortalStudent,
  StudentDirectory,
} from "@/modules/recordings/domain/student-directory";

export class StudentCodeNotFoundError extends DomainError {
  constructor() {
    // Deliberately vague: a precise message would turn this form into an
    // oracle for probing which code numbers exist.
    super("No student matches that code number.", "STUDENT_CODE_NOT_FOUND");
  }
}

export const studentCodeSchema = z.object({
  code: z.coerce.number().int().positive().max(2_147_483_647),
});

export type AuthenticateStudentByCodeDeps = {
  readonly studentDirectory: StudentDirectory;
};

/** Exchanges a code number for the student it identifies. No password involved. */
export async function authenticateStudentByCode(
  deps: AuthenticateStudentByCodeDeps,
  input: z.input<typeof studentCodeSchema>,
): Promise<Result<PortalStudent, StudentCodeNotFoundError>> {
  const parsed = studentCodeSchema.safeParse(input);
  if (!parsed.success) {
    return err(new StudentCodeNotFoundError());
  }

  const student = await deps.studentDirectory.findByCode(parsed.data.code);
  if (!student) {
    return err(new StudentCodeNotFoundError());
  }

  return ok(student);
}
