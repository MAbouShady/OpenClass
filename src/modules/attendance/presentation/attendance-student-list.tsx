"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AttendanceRow } from "@/modules/attendance/presentation/attendance-row";
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance";

type Row = {
  studentId: string;
  studentName: string;
  studentIdNumber: number | null;
  status: AttendanceStatus | "UNMARKED";
  checkInTime: Date | null;
  checkOutTime: Date | null;
  markPresentAction: () => Promise<void>;
  markAbsentAction: () => Promise<void>;
};

type Props = {
  rows: Row[];
};

export function AttendanceStudentList({ rows }: Props) {
  const t = useTranslations("attendance");
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? rows.filter((r) => {
        const q = query.toLowerCase();
        return (
          r.studentName.toLowerCase().includes(q) ||
          (r.studentIdNumber != null && String(r.studentIdNumber).includes(q))
        );
      })
    : rows;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {query ? t("noResults") : t("noStudents")}
        </p>
      ) : (
        filtered.map((row) => (
          <AttendanceRow
            key={row.studentId}
            studentName={row.studentName}
            studentIdNumber={row.studentIdNumber}
            status={row.status}
            checkInTime={row.checkInTime}
            checkOutTime={row.checkOutTime}
            markPresentAction={row.markPresentAction}
            markAbsentAction={row.markAbsentAction}
          />
        ))
      )}
    </div>
  );
}
