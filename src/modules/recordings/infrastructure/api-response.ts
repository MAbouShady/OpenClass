import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/shared/domain/result";

/**
 * Maps a domain error onto a status code. Only the domain message is ever
 * returned — stack traces, filesystem paths and storage details stay server-side.
 */
const STATUS_BY_CODE: Record<string, number> = {
  RECORDED_VIDEO_NOT_FOUND: 404,
  RECORDED_VIDEO_COURSE_NOT_FOUND: 404,
  VIDEO_ASSET_NOT_FOUND: 404,
  RECORDED_VIDEO_FORBIDDEN: 403,
  PLAYBACK_FORBIDDEN: 403,
  COURSE_NOT_STARTED: 403,
  COURSE_PAYMENT_REQUIRED: 403,
  VIDEO_NOT_PROCESSED: 409,
  VIDEO_PROCESSING_NOT_RETRYABLE: 409,
  INVALID_VIDEO_FILE: 400,
  UPLOAD_SESSION_NOT_FOUND: 404,
};

export function errorResponse(error: DomainError): NextResponse {
  const status = STATUS_BY_CODE[error.code] ?? 400;
  return NextResponse.json({ error: error.message, code: error.code }, { status });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "You do not have access to this resource." }, { status: 403 });
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function badRequest(message = "Invalid request."): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Logs the real cause, tells the caller nothing about it.
 *
 * Malformed input is answered with a 400 rather than a 500: a bad value from a
 * client should never read as a server fault, and a schema failure must not be
 * a way to make the endpoint throw.
 */
export function internalError(context: string, cause: unknown): NextResponse {
  if (cause instanceof ZodError) {
    return badRequest(cause.issues[0]?.message ?? "Invalid request.");
  }
  console.error(`[recordings] ${context}`, cause);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
