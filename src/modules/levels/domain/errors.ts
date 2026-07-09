import { DomainError } from "@/shared/domain/result";

export class LevelNameTakenError extends DomainError {
  constructor(name: string) {
    super(`A level named "${name}" already exists.`, "LEVEL_NAME_TAKEN");
  }
}

export class LevelNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Level "${id}" was not found.`, "LEVEL_NOT_FOUND");
  }
}
