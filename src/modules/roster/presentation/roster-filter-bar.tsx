"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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

export function RosterFilterBar({ courseOptions, semesterOptions }: RosterFilterBarProps) {
  const t = useTranslations("roster");
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

  const sessionTypeOptions = [
    { value: "ONLINE", label: t("online") },
    { value: "OFFLINE", label: t("offline") },
  ];

  const paymentStatusOptions = [
    { value: "APPROVED", label: t("paid") },
    { value: "PENDING", label: t("pending") },
    { value: "UNPAID", label: t("unpaid") },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("courseId") ?? ""} onValueChange={(val) => setParam("courseId", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("allCourses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allCourses")}</SelectItem>
            {courseOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("semesterId") ?? ""} onValueChange={(val) => setParam("semesterId", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("allSemesters")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allSemesters")}</SelectItem>
            {semesterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("sessionType") ?? ""} onValueChange={(val) => setParam("sessionType", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("allTypes")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allTypes")}</SelectItem>
            {sessionTypeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Select value={searchParams.get("paymentStatus") ?? ""} onValueChange={(val) => setParam("paymentStatus", val)}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("allStatuses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allStatuses")}</SelectItem>
            {paymentStatusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
