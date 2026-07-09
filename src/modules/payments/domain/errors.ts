import { DomainError } from "@/shared/domain/result";

export class PaymentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Payment "${id}" was not found.`, "PAYMENT_NOT_FOUND");
  }
}

export class PaymentAlreadyExistsError extends DomainError {
  constructor() {
    super("A payment for this month already exists.", "PAYMENT_ALREADY_EXISTS");
  }
}
