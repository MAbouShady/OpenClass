"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterOption = { readonly value: string; readonly label: string };

type RosterFilterBarProps = {
  readonly courseOptions: readonly FilterOption[];
  readonly semesterOptions: readonly FilterOption[];
};

const SESSION_TYPE_OPTIONS = [
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "APPROVED", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "UNPAID", label: "Unpaid" },
];

export function RosterFilterBar({ courseOptions, semesterOptions }: RosterFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("courseId") ?? ""} onValueChange={(val) => setParam("courseId", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All courses</SelectItem>
            {courseOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("semesterId") ?? ""} onValueChange={(val) => setParam("semesterId", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All semesters" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All semesters</SelectItem>
            {semesterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("sessionType") ?? ""} onValueChange={(val) => setParam("sessionType", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {SESSION_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("paymentStatus") ?? ""} onValueChange={(val) => setParam("paymentStatus", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
