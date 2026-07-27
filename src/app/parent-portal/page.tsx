import type { Metadata } from "next";
import { GraduationCap, Search, BookOpen, CreditCard, CalendarCheck, Clock, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Parent Portal — OpenClass" };

type PageProps = {
  readonly searchParams: Promise<Record<string, string | undefined>>;
};

async function lookupStudent(idNumber: number) {
  const user = await prisma.user.findUnique({
    where: { idNumber },
    select: { id: true, name: true, idNumber: true, role: true },
  });
  if (!user || user.role !== "STUDENT") return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    include: {
      payments: { orderBy: { month: "desc" } },
      semester: {
        include: {
          course: true,
          sessions: {
            orderBy: { startTime: "asc" },
            include: { attendances: { where: { studentId: user.id } } },
          },
        },
      },
    },
  });

  return { ...user, enrollments };
}

type Student = Awaited<ReturnType<typeof lookupStudent>>;
type Enrollment = NonNullable<Student>["enrollments"][number];

type Labels = {
  online: string;
  offline: string;
  paid: string;
  pending: string;
  unpaid: string;
  attended: (present: number, total: number) => string;
  noSessions: string;
  dateCol: string;
  checkInCol: string;
  checkOutCol: string;
  statusCol: string;
  present: string;
  absent: string;
};

function fmtDate(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

function fmtTime(d: Date | null, locale: string) {
  if (!d) return null;
  return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(d);
}

function fmtMonth(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(d);
}

function AttendanceStatusIcon({ status }: { status: "PRESENT" | "ABSENT" | null }) {
  if (status === "PRESENT")
    return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
  if (status === "ABSENT")
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <MinusCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />;
}

function EnrollmentCard({
  enrollment,
  labels,
  locale,
}: {
  enrollment: Enrollment;
  labels: Labels;
  locale: string;
}) {
  const course = enrollment.semester.course;
  const sessions = enrollment.semester.sessions;
  const payments = enrollment.payments;
  const latestPayment = payments[0] ?? null;

  const presentCount = sessions.filter((s) => s.attendances[0]?.status === "PRESENT").length;
  const absentCount = sessions.filter((s) => s.attendances[0]?.status === "ABSENT").length;
  const attendancePct = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0;

  const paymentStatus = !latestPayment
    ? "unpaid"
    : latestPayment.status === "APPROVED"
    ? "paid"
    : "pending";

  const paymentTopColor =
    paymentStatus === "paid"
      ? "bg-success"
      : paymentStatus === "pending"
      ? "bg-warning"
      : "bg-border";

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Color bar top */}
      <div className={`h-1 w-full ${paymentTopColor}`} />

      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base leading-tight">{course.title}</h3>
            <Badge variant="outline" className="w-fit text-xs">
              {course.sessionType === "ONLINE" ? labels.online : labels.offline}
            </Badge>
          </div>

          {/* Payment badge - prominent */}
          {paymentStatus === "paid" ? (
            <Badge variant="success" className="text-sm px-3 py-1 gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {labels.paid}
            </Badge>
          ) : paymentStatus === "pending" ? (
            <Badge variant="warning" className="text-sm px-3 py-1">
              {labels.pending}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {labels.unpaid}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 flex flex-col gap-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Attendance stat */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{labels.attended(presentCount, sessions.length)}</p>
              <p className="text-lg font-bold leading-tight">{attendancePct}%</p>
            </div>
          </div>

          {/* Payment history count */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              {payments.length === 0 ? (
                <p className="text-sm font-medium text-muted-foreground">{labels.unpaid}</p>
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {payments.map((p) => (
                    <span key={p.id} className="text-xs leading-tight">
                      <span className="text-muted-foreground">{p.month ? fmtMonth(p.month, locale) : "—"}</span>
                      <span
                        className={`ms-1 font-medium ${
                          p.status === "APPROVED"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        {p.status === "APPROVED" ? "✓" : "⏳"}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance log */}
        {sessions.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {labels.dateCol}
              </span>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">
                      {labels.dateCol}
                    </th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">
                      {labels.checkInCol}
                    </th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">
                      {labels.checkOutCol}
                    </th>
                    <th className="py-2 px-3 text-start text-xs font-medium text-muted-foreground">
                      {labels.statusCol}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, i) => {
                    const att = session.attendances[0] ?? null;
                    const checkIn = att ? fmtTime(att.checkInTime, locale) : null;
                    const checkOut = att ? fmtTime(att.checkOutTime, locale) : null;
                    const status = att?.status ?? null;
                    return (
                      <tr
                        key={session.id}
                        className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
                      >
                        <td className="py-2.5 px-3 font-medium">
                          {fmtDate(session.startTime, locale)}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                          {checkIn ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                          {checkOut ?? "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <AttendanceStatusIcon status={status} />
                            <span
                              className={`text-xs font-medium ${
                                status === "PRESENT"
                                  ? "text-success"
                                  : status === "ABSENT"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {status === "PRESENT"
                                ? labels.present
                                : status === "ABSENT"
                                ? labels.absent
                                : "—"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{labels.noSessions}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ParentPortalPage({ searchParams }: PageProps) {
  const [params, t, locale] = await Promise.all([
    searchParams,
    getTranslations("parentPortal"),
    getLocale(),
  ]);

  const idStr = params.id?.trim();
  const idNumber = idStr ? parseInt(idStr, 10) : null;
  const validId = idNumber !== null && !isNaN(idNumber);

  const student = validId ? await lookupStudent(idNumber!) : null;
  const notFound = validId && !student;

  const labels: Labels = {
    online: t("online"),
    offline: t("offline"),
    paid: t("paid"),
    pending: t("pending"),
    unpaid: t("unpaid"),
    attended: (present, total) => t("attended", { present, total }),
    noSessions: t("noSessions"),
    dateCol: t("dateCol"),
    checkInCol: t("checkInCol"),
    checkOutCol: t("checkOutCol"),
    statusCol: t("statusCol"),
    present: t("present"),
    absent: t("absent"),
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">OpenClass</span>
          <span className="text-border mx-1">·</span>
          <span className="text-sm text-muted-foreground">{t("title")}</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-1">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm max-w-xs">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 flex flex-col gap-8 -mt-2">

        {/* Search card */}
        <Card className="shadow-md">
          <CardContent className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <Label htmlFor="sid" className="text-base font-semibold">
                {t("idLabel")}
              </Label>
              <p className="text-sm text-muted-foreground">{t("idHint")}</p>
            </div>
            <form method="GET" action="/parent-portal" className="flex gap-3">
              <Input
                id="sid"
                name="id"
                type="number"
                placeholder={t("idPlaceholder")}
                defaultValue={idStr ?? ""}
                className="text-base h-11 max-w-[200px]"
                min={1}
              />
              <Button type="submit" size="lg" className="gap-2 px-6">
                <Search className="h-4 w-4" />
                {t("searchBtn")}
              </Button>
            </form>

            {/* Not found inline */}
            {notFound && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive font-medium">
                  {t("notFound", { id: idNumber! })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student results */}
        {student && (
          <div className="flex flex-col gap-5">

            {/* Student profile banner */}
            <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-sm">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base leading-tight truncate">{student.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("studentIdLabel", { id: student.idNumber! })}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-xs text-muted-foreground">{student.enrollments.length}</p>
                <p className="text-xs text-muted-foreground">
                  {student.enrollments.length === 1 ? "course" : "courses"}
                </p>
              </div>
            </div>

            {student.enrollments.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noEnrollments")}</p>
              </div>
            ) : (
              student.enrollments.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  labels={labels}
                  locale={locale}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
