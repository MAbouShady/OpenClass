"use client";

import { useState, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays, Loader2 } from "lucide-react";
import type { ActionState } from "@/shared/domain/action-state";

type SerializedSemester = {
  readonly id: string;
  readonly startDate: string; // ISO
  readonly endDate: string;   // ISO
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

type DayTimes = { start: string; end: string };

type Props = {
  courseId: string;
  semesters: readonly SerializedSemester[];
  bulkCreateAction: (_prev: ActionState, fd: FormData) => Promise<ActionState>;
};

function isoToDate(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

// Convert local "HH:MM" to UTC "HH:MM" using the browser's timezone offset.
function localHHMMtoUtc(hhmm: string): string {
  const parts = hhmm.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const offsetMin = new Date().getTimezoneOffset();
  const totalMin = ((h * 60 + m + offsetMin) % 1440 + 1440) % 1440;
  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function countSessions(from: string, to: string, days: Set<number>): number {
  if (!from || !to || days.size === 0) return 0;
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T23:59:59");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  let n = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (days.has(cur.getDay())) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.min(n, 500);
}

export function BulkAddSessionsModal({ courseId, semesters, bulkCreateAction }: Props) {
  const t = useTranslations("sessions");
  const tCommon = useTranslations("common");

  const DAYS = DAY_KEYS.map((key, i) => ({ label: t(key), value: i }));

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const [semesterId, setSemesterId] = useState<string>(semesters[0]?.id ?? "");
  const [fromDate, setFromDate] = useState(() => semesters[0] ? isoToDate(semesters[0].startDate) : "");
  const [toDate, setToDate] = useState(() => semesters[0] ? isoToDate(semesters[0].endDate) : "");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [times, setTimes] = useState<Record<number, DayTimes>>({});

  const selectedSemester = semesters.find((s) => s.id === semesterId);

  const preview = useMemo(
    () => countSessions(fromDate, toDate, selectedDays),
    [fromDate, toDate, selectedDays],
  );

  const handleSemesterChange = (id: string) => {
    setSemesterId(id);
    const sem = semesters.find((s) => s.id === id);
    if (sem) {
      setFromDate(isoToDate(sem.startDate));
      setToDate(isoToDate(sem.endDate));
    }
    setResultMsg(null);
    setError(null);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
    setTimes((prev) =>
      prev[day] ? prev : { ...prev, [day]: { start: "09:00", end: "10:00" } },
    );
    setResultMsg(null);
  };

  const setTime = (day: number, field: keyof DayTimes, value: string) => {
    setTimes((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { start: "09:00", end: "10:00" }), [field]: value },
    }));
  };

  const reset = () => {
    const firstSem = semesters[0];
    setSemesterId(firstSem?.id ?? "");
    setFromDate(firstSem ? isoToDate(firstSem.startDate) : "");
    setToDate(firstSem ? isoToDate(firstSem.endDate) : "");
    setSelectedDays(new Set());
    setTimes({});
    setError(null);
    setResultMsg(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!semesterId) { setError(t("errorSelectSemester")); return; }
    if (selectedDays.size === 0) { setError(t("errorSelectDay")); return; }
    if (!fromDate || !toDate) { setError(t("errorSetDateRange")); return; }
    if (preview === 0) { setError(t("errorNoSessions")); return; }

    // Validate dates are within semester bounds
    if (selectedSemester) {
      const semStart = isoToDate(selectedSemester.startDate);
      const semEnd = isoToDate(selectedSemester.endDate);
      if (fromDate < semStart || toDate > semEnd) {
        setError(`Dates must be within semester: ${fmtDate(selectedSemester.startDate)} — ${fmtDate(selectedSemester.endDate)}`);
        return;
      }
    }

    const fd = new FormData();
    fd.set("courseId", courseId);
    fd.set("semesterId", semesterId);
    fd.set("fromDate", fromDate);
    fd.set("toDate", toDate);
    fd.set("days", Array.from(selectedDays).join(","));
    for (const day of selectedDays) {
      const dayTime = times[day] ?? { start: "09:00", end: "10:00" };
      fd.set(`start_${day}`, localHHMMtoUtc(dayTime.start));
      fd.set(`end_${day}`, localHHMMtoUtc(dayTime.end));
    }

    setError(null);
    setResultMsg(null);
    startTransition(async () => {
      const result = await bulkCreateAction({}, fd);
      if (result.error) {
        setError(result.error);
      } else {
        // result carries back created/skipped counts via a message field
        setResultMsg(result.message ?? "Sessions created.");
        setSelectedDays(new Set());
        setTimes({});
      }
    });
  };

  if (semesters.length === 0) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <CalendarDays size={15} />
        {t("bulkAddBtn")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarDays size={15} />
          {t("bulkAddBtn")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("bulkAddTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
          {/* Semester selector */}
          <div className="flex flex-col gap-1.5">
            <Label>{t("semesterLabel")}</Label>
            <Select value={semesterId} onValueChange={handleSemesterChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectSemester")} />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {fmtDate(s.startDate)} — {fmtDate(s.endDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range — pre-filled from semester, teacher can narrow it */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fromDate">{t("fromDateLabel")}</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                min={selectedSemester ? isoToDate(selectedSemester.startDate) : undefined}
                max={toDate || (selectedSemester ? isoToDate(selectedSemester.endDate) : undefined)}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="toDate">{t("toDateLabel")}</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                min={fromDate}
                max={selectedSemester ? isoToDate(selectedSemester.endDate) : undefined}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Day selector */}
          <div className="flex flex-col gap-2">
            <Label>{t("daysLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={[
                    "h-9 w-12 rounded-lg border text-sm font-medium transition-colors",
                    selectedDays.has(value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time inputs per selected day */}
          {selectedDays.size > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Times
              </p>
              {DAYS.filter((d) => selectedDays.has(d.value)).map(({ label, value }) => {
                const dayTime = times[value] ?? { start: "09:00", end: "10:00" };
                return (
                  <div key={value} className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-sm font-semibold">{label}</span>
                    <Input
                      type="time"
                      value={dayTime.start}
                      onChange={(e) => setTime(value, "start", e.target.value)}
                      className="flex-1"
                      required
                    />
                    <span className="text-xs text-muted-foreground shrink-0">to</span>
                    <Input
                      type="time"
                      value={dayTime.end}
                      onChange={(e) => setTime(value, "end", e.target.value)}
                      className="flex-1"
                      required
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview count */}
          {preview > 0 && !resultMsg && (
            <p className="text-sm text-muted-foreground">
              {t("previewSessions", { count: preview })}
              {preview === 500 && (
                <span className="text-amber-600 ms-1">(capped at 500)</span>
              )}
            </p>
          )}

          {resultMsg && (
            <p className="text-sm text-emerald-600 font-medium">{resultMsg}</p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); reset(); }}
            >
              {resultMsg ? tCommon("close") : tCommon("cancel")}
            </Button>
            {!resultMsg && (
              <Button type="submit" disabled={isPending || preview === 0}>
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin me-1" /> {tCommon("creating")}
                  </>
                ) : (
                  `Add ${preview > 0 ? preview : ""} session${preview !== 1 ? "s" : ""}`
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
