import { DomainError } from "@/shared/domain/result";

export class AlreadyEnrolledError extends DomainError {
  constructor() {
    super("You are already enrolled in this semester.", "ALREADY_ENROLLED");
  }
}

export class EnrollmentSemesterNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Semester "${id}" was not found.`, "ENROLLMENT_SEMESTER_NOT_FOUND");
  }
}
