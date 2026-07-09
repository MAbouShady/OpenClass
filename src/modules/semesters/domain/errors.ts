import { DomainError } from "@/shared/domain/result";

export class SemesterNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Semester "${id}" was not found.`, "SEMESTER_NOT_FOUND");
  }
}

export class InvalidSemesterDateRangeError extends DomainError {
  constructor() {
    super("Semester end date must be after its start date.", "SEMESTER_INVALID_DATE_RANGE");
  }
}
