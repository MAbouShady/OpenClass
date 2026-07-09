import { DomainError } from "@/shared/domain/result";

export class ParentLinkAlreadyExistsError extends DomainError {
  constructor() {
    super("This parent is already linked to this student.", "PARENT_LINK_ALREADY_EXISTS");
  }
}

export class UserNotFoundError extends DomainError {
  constructor(email: string) {
    super(`No user found with email "${email}".`, "FAMILY_USER_NOT_FOUND");
  }
}

export class WrongRoleError extends DomainError {
  constructor(message: string) {
    super(message, "WRONG_ROLE");
  }
}
