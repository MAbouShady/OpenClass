import { DomainError } from "@/shared/domain/result";

export class CourseNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Course "${id}" was not found.`, "COURSE_NOT_FOUND");
  }
}

export class CourseForbiddenError extends DomainError {
  constructor() {
    super("You do not have permission to modify this course.", "COURSE_FORBIDDEN");
  }
}
