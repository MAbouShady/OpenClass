// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateQrToken, verifyQrToken } from "@/modules/qr/domain/qr-token";

describe("qr-token", () => {
  it("round-trips a payload", () => {
    const token = generateQrToken({
      studentId: "student-1",
      courseId: "course-1",
      teacherId: "teacher-1",
    });
    const payload = verifyQrToken(token);

    expect(payload).toEqual({
      studentId: "student-1",
      courseId: "course-1",
      teacherId: "teacher-1",
    });
  });

  it("rejects a tampered token", () => {
    const token = generateQrToken({
      studentId: "student-1",
      courseId: "course-1",
      teacherId: "teacher-1",
    });
    const [encoded] = token.split(".");
    const tampered = `${encoded}.deadbeef`;

    expect(verifyQrToken(tampered)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(verifyQrToken("not-a-real-token")).toBeNull();
    expect(verifyQrToken("")).toBeNull();
  });
});
