import { DomainError } from "@/shared/domain/result";

export class RecordedVideoNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Recorded video "${id}" was not found.`, "RECORDED_VIDEO_NOT_FOUND");
  }
}

export class RecordedVideoForbiddenError extends DomainError {
  constructor() {
    super("You do not have permission to manage this recorded video.", "RECORDED_VIDEO_FORBIDDEN");
  }
}

export class RecordedVideoCourseNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Course "${id}" was not found.`, "RECORDED_VIDEO_COURSE_NOT_FOUND");
  }
}

export class VideoAssetNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Video asset "${id}" was not found.`, "VIDEO_ASSET_NOT_FOUND");
  }
}

export class VideoNotProcessedError extends DomainError {
  constructor() {
    super("This lesson is still being processed.", "VIDEO_NOT_PROCESSED");
  }
}

export class VideoProcessingNotRetryableError extends DomainError {
  constructor() {
    super("This video is not in a state that can be retried.", "VIDEO_PROCESSING_NOT_RETRYABLE");
  }
}

export class PlaybackForbiddenError extends DomainError {
  constructor() {
    super("You do not have access to this lesson.", "PLAYBACK_FORBIDDEN");
  }
}

/** The course has not started yet — access opens on the semester start date. */
export class CourseNotStartedError extends DomainError {
  constructor(readonly startsAt: Date | null) {
    super("This course has not started yet.", "COURSE_NOT_STARTED");
  }
}

/** Enrolled, started, but the period is unpaid (or the payment is unapproved). */
export class CoursePaymentRequiredError extends DomainError {
  constructor(readonly owedMonth: Date | null) {
    super(
      "Payment for this course is required before you can watch it.",
      "COURSE_PAYMENT_REQUIRED",
    );
  }
}

export class InvalidVideoFileError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_VIDEO_FILE");
  }
}

export class UploadSessionNotFoundError extends DomainError {
  constructor() {
    super("Upload session was not found or has expired.", "UPLOAD_SESSION_NOT_FOUND");
  }
}
