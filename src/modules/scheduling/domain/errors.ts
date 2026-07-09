import { DomainError } from "@/shared/domain/result";

export class ClassSessionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Session "${id}" was not found.`, "SESSION_NOT_FOUND");
  }
}

export class InvalidSessionTimeRangeError extends DomainError {
  constructor() {
    super("Session end time must be after its start time.", "SESSION_INVALID_TIME_RANGE");
  }
}
