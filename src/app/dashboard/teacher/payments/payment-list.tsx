"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  approvePaymentAction,
  confirmCashPaymentAction,
  deletePaymentAction,
} from "@/app/dashboard/teacher/payments/actions";
import type { EnrollmentPaymentSummary, PaymentRow } from "@/modules/payments/domain/payment-repository";

type Filter = "ALL" | "UNPAID" | "PENDING" | "APPROVED";

type Props = {
  enrollments: readonly EnrollmentPaymentSummary[];
};

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function statusColor(status: "APPROVED" | "PENDING" | "UNPAID") {
  if (status === "APPROVED") return "#16a34a";
  if (status === "PENDING") return "#ca8a04";
  return "#dc2626";
}

function latestStatus(e: EnrollmentPaymentSummary): "APPROVED" | "PENDING" | "UNPAID" {
  if (!e.latestPayment) return "UNPAID";
  if (e.paymentFrequency !== "MONTHLY") {
    return e.latestPayment.status;
  }
  const p = new Date(e.latestPayment.month);
  const now = new Date();
  const isCurrentMonth =
    p.getFullYear() === now.getFullYear() && p.getMonth() === now.getMonth();
  return isCurrentMonth ? e.latestPayment.status : "UNPAID";
}

function canAddPayment(e: EnrollmentPaymentSummary): boolean {
  if (e.paymentFrequency === "MONTHLY") return true;
  return !e.allPayments.some((p) => p.status === "APPROVED");
}

export function PaymentList({ enrollments }: Props) {
  const t = useTranslations("payments");
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [levelId, setLevelId] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmMonth, setConfirmMonth] = useState(currentMonthValue);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actingId, setActingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const uniqueCourses = Array.from(
    new Map(enrollments.map((e) => [e.courseId, { id: e.courseId, name: e.courseName }])).values(),
  );
  const uniqueLevels = Array.from(
    new Map(enrollments.map((e) => [e.levelId, { id: e.levelId, name: e.levelName }])).values(),
  );

  const visible = enrollments.filter((e) => {
    if (filter !== "ALL" && latestStatus(e) !== filter) return false;
    if (courseId !== "all" && e.courseId !== courseId) return false;
    if (levelId !== "all" && e.levelId !== levelId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = e.studentName.toLowerCase().includes(q);
      const matchId = e.studentIdNumber != null && String(e.studentIdNumber).includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  function toggleExpand(enrollmentId: string) {
    setExpandedId((prev) => (prev === enrollmentId ? null : enrollmentId));
    setConfirmingId(null);
    setConfirmError(null);
  }

  function openConfirm(enrollmentId: string) {
    setConfirmingId(enrollmentId);
    setConfirmMonth(currentMonthValue());
    setConfirmNotes("");
    setConfirmError(null);
  }

  function handleApprove(paymentId: string) {
    const fd = new FormData();
    fd.set("paymentId", paymentId);
    setActingId(paymentId);
    startTransition(async () => {
      await approvePaymentAction({}, fd);
      setActingId(null);
      router.refresh();
    });
  }

  function handleDelete(paymentId: string) {
    const fd = new FormData();
    fd.set("paymentId", paymentId);
    setActingId(paymentId);
    setDeletingId(null);
    startTransition(async () => {
      await deletePaymentAction({}, fd);
      setActingId(null);
      router.refresh();
    });
  }

  function handleConfirmCash(enrollmentId: string) {
    const fd = new FormData();
    fd.set("enrollmentId", enrollmentId);
    fd.set("month", confirmMonth + "-01");
    if (confirmNotes.trim()) fd.set("notes", confirmNotes.trim());
    setActingId(enrollmentId);
    startTransition(async () => {
      const result = await confirmCashPaymentAction({}, fd);
      setActingId(null);
      if (result.error) {
        setConfirmError(result.error);
      } else {
        setConfirmingId(null);
        router.refresh();
      }
    });
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: t("filterAll") },
    { key: "UNPAID", label: t("filterUnpaid") },
    { key: "PENDING", label: t("filterPending") },
    { key: "APPROVED", label: t("filterApproved") },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Search + selects */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        {uniqueLevels.length > 0 && (
          <Select value={levelId} onValueChange={setLevelId}>
            <SelectTrigger className="w-36 h-9 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allLevels")}</SelectItem>
              {uniqueLevels.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {uniqueCourses.length > 0 && (
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-40 h-9 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCourses")}</SelectItem>
              {uniqueCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {label}
            {key !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({enrollments.filter((e) => latestStatus(e) === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {enrollments.length === 0 ? t("noPayments") : t("noFilterResults")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((enrollment) => {
            const status = latestStatus(enrollment);
            const isExpanded = expandedId === enrollment.enrollmentId;
            const isConfirming = confirmingId === enrollment.enrollmentId;

            return (
              <div key={enrollment.enrollmentId} className="rounded-xl border bg-card overflow-hidden">
                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(enrollment.enrollmentId)}
                  className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-start hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{enrollment.studentName}</span>
                      {enrollment.studentIdNumber != null && (
                        <Badge variant="secondary" className="text-xs">
                          #{enrollment.studentIdNumber}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{enrollment.courseName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {enrollment.latestPayment && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(enrollment.latestPayment.month).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                    {enrollment.coursePrice != null && (
                      <span className="text-xs font-medium">{enrollment.coursePrice} LE</span>
                    )}
                    <Badge className="text-xs text-white shrink-0" style={{ backgroundColor: statusColor(status) }}>
                      {status === "APPROVED" ? t("statusApproved") : status === "PENDING" ? t("statusPending") : t("statusUnpaid")}
                    </Badge>
                    <ChevronDown
                      size={14}
                      className="text-muted-foreground transition-transform duration-200 shrink-0"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 flex flex-col gap-3">
                    {enrollment.allPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("noPaymentsYet")}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {enrollment.allPayments.map((p: PaymentRow) => (
                          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                            <span className="text-sm font-medium min-w-24">
                              {new Date(p.month).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {p.method === "ONLINE" ? t("methodOnline") : t("methodCash")}
                            </Badge>
                            <Badge className="text-xs text-white" style={{ backgroundColor: statusColor(p.status) }}>
                              {p.status === "APPROVED" ? t("statusApproved") : t("statusPending")}
                            </Badge>
                            {p.proofUrl && (
                              <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-2">
                                {t("viewProof")}
                              </a>
                            )}
                            {p.notes && <span className="text-xs text-muted-foreground italic flex-1">{p.notes}</span>}
                            <div className="flex items-center gap-1.5 ms-auto">
                              {p.status === "PENDING" && (
                                <Button size="sm" disabled={isPending && actingId === p.id} onClick={() => handleApprove(p.id)} className="h-7 text-xs">
                                  {isPending && actingId === p.id ? t("approving") : t("approveBtn")}
                                </Button>
                              )}
                              {deletingId === p.id ? (
                                <>
                                  <Button size="sm" variant="destructive" disabled={isPending && actingId === p.id} onClick={() => handleDelete(p.id)} className="h-7 text-xs">
                                    {t("deleteConfirmBtn")}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)} className="h-7 text-xs">
                                    {t("cancelBtn")}
                                  </Button>
                                </>
                              ) : (
                                <button type="button" onClick={() => setDeletingId(p.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add payment form */}
                    {canAddPayment(enrollment) && (
                      !isConfirming ? (
                        <Button size="sm" variant="outline" onClick={() => openConfirm(enrollment.enrollmentId)} className="self-start">
                          {t("confirmPaymentBtn")}
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">{t("monthLabel")}</Label>
                              <input
                                type="month"
                                value={confirmMonth}
                                onChange={(e) => setConfirmMonth(e.target.value)}
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-36">
                              <Label className="text-xs">{t("notesOptional")}</Label>
                              <Input value={confirmNotes} onChange={(e) => setConfirmNotes(e.target.value)} placeholder={t("notesPlaceholder")} className="h-9 text-sm" />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" disabled={isPending && actingId === enrollment.enrollmentId} onClick={() => handleConfirmCash(enrollment.enrollmentId)} className="h-9">
                                {isPending && actingId === enrollment.enrollmentId ? t("confirming") : t("confirmBtn")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)} className="h-9">
                                {t("cancelBtn")}
                              </Button>
                            </div>
                          </div>
                          {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
