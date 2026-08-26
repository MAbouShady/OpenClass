import type { PaymentFrequency } from "@/modules/courses/domain/payment-frequency";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";

export const COURSE_ACCESS_DENIALS = ["NOT_ENROLLED", "NOT_STARTED", "PAYMENT_REQUIRED"] as const;

export type CourseAccessDenial = (typeof COURSE_ACCESS_DENIALS)[number];

export type CourseAccess =
  | { readonly granted: true; readonly enrollmentId: string; readonly semesterId: string }
  | {
      readonly granted: false;
      readonly reason: CourseAccessDenial;
      /** Set for NOT_STARTED: the earliest date this student's access opens. */
      readonly startsAt: Date | null;
      /** Set for PAYMENT_REQUIRED on a recurring course: the month that is owed. */
      readonly owedMonth: Date | null;
    };

/** One enrolment, flattened with everything the rule needs to judge it. */
export type EnrollmentAccessFacts = {
  readonly enrollmentId: string;
  readonly semesterId: string;
  readonly semesterStartDate: Date;
  readonly paymentFrequency: PaymentFrequency;
  /** Months (normalized to month start) with an APPROVED payment on this enrolment. */
  readonly approvedMonths: readonly Date[];
};

function hasApprovedMonth(facts: EnrollmentAccessFacts, month: Date): boolean {
  const target = month.getTime();
  return facts.approvedMonths.some((approved) => approved.getTime() === target);
}

/**
 * Whether the period this enrolment covers is paid for.
 *
 * Payment only — deliberately says nothing about whether the semester has
 * started, so it can answer both "may this student watch?" and "how many
 * students have paid?" without the two drifting apart. A recurring course
 * needs the *current* month; anything else needs one approved payment.
 */
export function isPeriodPaid(facts: EnrollmentAccessFacts, asOf: Date): boolean {
  return facts.paymentFrequency === "MONTHLY"
    ? hasApprovedMonth(facts, normalizeToMonthStart(asOf))
    : facts.approvedMonths.length > 0;
}

/**
 * Decides whether a student may watch a course's recorded lessons.
 *
 * Enrolment alone is never enough. Three things must hold:
 *
 *  1. The student holds an enrolment in one of the course's semesters.
 *  2. That semester has actually started — a course that begins next month, or
 *     in three months, opens on its start date and not before, no matter when
 *     the student enrolled or paid.
 *  3. The payment for the period is APPROVED. On a recurring (MONTHLY) course
 *     that means the *current* month specifically: last month's payment buys
 *     last month, and access lapses the moment a new month begins unpaid.
 *
 * A pending, unapproved payment does not count — only APPROVED does.
 */
export function decideCourseAccess(
  enrollments: readonly EnrollmentAccessFacts[],
  asOf: Date,
): CourseAccess {
  if (enrollments.length === 0) {
    return { granted: false, reason: "NOT_ENROLLED", startsAt: null, owedMonth: null };
  }

  const started = enrollments.filter(
    (facts) => facts.semesterStartDate.getTime() <= asOf.getTime(),
  );

  if (started.length === 0) {
    const startsAt = enrollments
      .map((facts) => facts.semesterStartDate)
      .reduce((earliest, candidate) => (candidate < earliest ? candidate : earliest));
    return { granted: false, reason: "NOT_STARTED", startsAt, owedMonth: null };
  }

  const currentMonth = normalizeToMonthStart(asOf);

  for (const facts of started) {
    if (isPeriodPaid(facts, asOf)) {
      return { granted: true, enrollmentId: facts.enrollmentId, semesterId: facts.semesterId };
    }
  }

  return {
    granted: false,
    reason: "PAYMENT_REQUIRED",
    startsAt: null,
    owedMonth: started.some((facts) => facts.paymentFrequency === "MONTHLY") ? currentMonth : null,
  };
}
