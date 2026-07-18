"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentCard } from "@/modules/students/presentation/student-card";
import type { StudentWithCourses } from "@/modules/students/domain/student";
import type { Level } from "@/modules/levels/domain/level";
import type { CourseOption, ParentOption } from "@/modules/students/domain/student-repository";
import type { ActionState } from "@/shared/domain/action-state";

type Props = {
  students: readonly StudentWithCourses[];
  levels: readonly Level[];
  parents: readonly ParentOption[];
  courseOptions: readonly CourseOption[];
  updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  enrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<ActionState>;
};

export function StudentSearchList({
  students,
  levels,
  parents,
  courseOptions,
  updateAction,
  enrollAction,
  deleteAction,
}: Props) {
  const t = useTranslations("students");
  const [query, setQuery] = useState("");
  const [levelId, setLevelId] = useState("all");

  const usedLevelIds = new Set(students.map((s) => s.levelId).filter(Boolean));
  const usedLevels = levels.filter((l) => usedLevelIds.has(l.id));

  const filtered = students.filter((s) => {
    if (levelId !== "all" && s.levelId !== levelId) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone?.toLowerCase().includes(q) ?? false) ||
      (s.idNumber != null && String(s.idNumber).includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {usedLevels.length > 0 && (
          <Select value={levelId} onValueChange={setLevelId}>
            <SelectTrigger className="w-40 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allLevels")}</SelectItem>
              {usedLevels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground text-center">
          {query || levelId !== "all" ? t("noSearchResults") : t("noStudents")}
        </p>
      ) : (
        filtered.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            levels={levels}
            parents={parents}
            courseOptions={courseOptions}
            updateAction={updateAction}
            enrollAction={enrollAction}
            deleteAction={deleteAction}
          />
        ))
      )}
    </div>
  );
}
