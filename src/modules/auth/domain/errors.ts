import { DomainError } from "@/shared/domain/result";

export class EmailAlreadyTakenError extends DomainError {
  constructor(email: string) {
    super(`An account with email "${email}" already exists.`, "EMAIL_ALREADY_TAKEN");
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Invalid email or password.", "INVALID_CREDENTIALS");
  }
}
