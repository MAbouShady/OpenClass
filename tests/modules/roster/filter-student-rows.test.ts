import { describe, expect, it } from "vitest";
import { filterStudentRows } from "@/modules/roster/application/filter-student-rows";
import type { StudentRow } from "@/modules/roster/domain/student-row";

const ROWS: StudentRow[] = [
  {
    enrollmentId: "enrollment-1",
    studentId: "student-1",
    studentName: "Alice",
    studentIdNumber: 1,
    studentEmail: "a@example.com",
    courseId: "course-1",
    courseTitle: "Course A",
    sessionType: "OFFLINE",
    semesterId: "semester-1",
    paymentStatus: "APPROVED",
    attendedCount: 3,
    totalSessions: 5,
  },
  {
    enrollmentId: "enrollment-2",
    studentId: "student-2",
    studentName: "Bob",
    studentIdNumber: 2,
    studentEmail: "b@example.com",
    courseId: "course-1",
    courseTitle: "Course A",
    sessionType: "OFFLINE",
    semesterId: "semester-2",
    paymentStatus: "UNPAID",
    attendedCount: 0,
    totalSessions: 5,
  },
  {
    enrollmentId: "enrollment-3",
    studentId: "student-3",
    studentName: "Carol",
    studentIdNumber: 3,
    studentEmail: "c@example.com",
    courseId: "course-2",
    courseTitle: "Course B",
    sessionType: "ONLINE",
    semesterId: "semester-3",
    paymentStatus: "PENDING",
    attendedCount: 1,
    totalSessions: 2,
  },
];

describe("filterStudentRows", () => {
  it("returns all rows when no filters are given", () => {
    expect(filterStudentRows(ROWS, {})).toHaveLength(3);
  });

  it("filters by course", () => {
    const result = filterStudentRows(ROWS, { courseId: "course-1" });
    expect(result.map((row) => row.enrollmentId)).toEqual(["enrollment-1", "enrollment-2"]);
  });

  it("filters by semester", () => {
    const result = filterStudentRows(ROWS, { semesterId: "semester-3" });
    expect(result.map((row) => row.enrollmentId)).toEqual(["enrollment-3"]);
  });

  it("filters by session type", () => {
    const result = filterStudentRows(ROWS, { sessionType: "ONLINE" });
    expect(result.map((row) => row.enrollmentId)).toEqual(["enrollment-3"]);
  });

  it("filters by payment status", () => {
    const result = filterStudentRows(ROWS, { paymentStatus: "UNPAID" });
    expect(result.map((row) => row.enrollmentId)).toEqual(["enrollment-2"]);
  });

  it("combines multiple filters", () => {
    const result = filterStudentRows(ROWS, { courseId: "course-1", paymentStatus: "APPROVED" });
    expect(result.map((row) => row.enrollmentId)).toEqual(["enrollment-1"]);
  });
});
