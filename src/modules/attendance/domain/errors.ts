import { DomainError } from "@/shared/domain/result";

export class InvalidQrTokenError extends DomainError {
  constructor() {
    super("This QR code is invalid or has been tampered with.", "INVALID_QR_TOKEN");
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Session "${id}" was not found.`, "ATTENDANCE_SESSION_NOT_FOUND");
  }
}

export class WrongCourseError extends DomainError {
  constructor() {
    super("This QR code belongs to a different course.", "WRONG_COURSE");
  }
}

export class OnlineSessionScanNotAllowedError extends DomainError {
  constructor() {
    super(
      "Online sessions do not require a QR scan; mark attendance manually.",
      "ONLINE_SCAN_NOT_ALLOWED",
    );
  }
}

export class EnrollmentRequiredError extends DomainError {
  constructor() {
    super("This student is not enrolled in this course.", "ENROLLMENT_REQUIRED");
  }
}

export class PaymentRequiredError extends DomainError {
  constructor() {
    super("الطالب ده مش دافع الشهر ده.", "PAYMENT_REQUIRED");
  }
}

export class AlreadyCheckedInError extends DomainError {
  constructor() {
    super("This student has already checked in to this session.", "ALREADY_CHECKED_IN");
  }
}

export class NotCheckedInError extends DomainError {
  constructor() {
    super("This student has not checked in to this session yet.", "NOT_CHECKED_IN");
  }
}

export class AlreadyCheckedOutError extends DomainError {
  constructor() {
    super("This student has already checked out of this session.", "ALREADY_CHECKED_OUT");
  }
}
