"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataShell, ResultCount, Toolbar } from "@/components/common/data-shell";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { StudentTable } from "@/modules/students/presentation/student-table";
import type { StudentWithCourses } from "@/modules/students/domain/student";
import type { Level } from "@/modules/levels/domain/level";
import type { CourseOption, ParentOption } from "@/modules/students/domain/student-repository";
import type { ActionState } from "@/shared/domain/action-state";

const PAGE_SIZE = 20;
const ALL = "all";

type Props = {
  readonly students: readonly StudentWithCourses[];
  readonly levels: readonly Level[];
  readonly parents: readonly ParentOption[];
  readonly courseOptions: readonly CourseOption[];
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly enrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<ActionState>;
};

export function StudentSearchList({ students, levels, ...actions }: Props) {
  const t = useTranslations("students");
  const [query, setQuery] = useState("");
  const [levelId, setLevelId] = useState(ALL);
  const [page, setPage] = useState(1);
  const [filterKey, setFilterKey] = useState(`${ALL}:`);

  // Changing a filter resets paging during render, rather than from an effect
  // that would render the wrong page first and then correct it.
  const nextFilterKey = `${levelId}:${query}`;
  if (filterKey !== nextFilterKey) {
    setFilterKey(nextFilterKey);
    setPage(1);
  }

  const usedLevelIds = new Set(students.map((s) => s.levelId).filter(Boolean));
  const usedLevels = levels.filter((level) => usedLevelIds.has(level.id));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      if (levelId !== ALL && student.levelId !== levelId) return false;
      if (!needle) return true;
      return (
        student.name.toLowerCase().includes(needle) ||
        (student.phone?.toLowerCase().includes(needle) ?? false) ||
        (student.idNumber !== null && String(student.idNumber).includes(needle))
      );
    });
  }, [students, query, levelId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder={t("searchPlaceholder")} />
        {usedLevels.length > 0 && (
          <Select value={levelId} onValueChange={setLevelId}>
            <SelectTrigger className="h-9 sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("allLevels")}</SelectItem>
              {usedLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Toolbar>

      <ResultCount shown={filtered.length} total={students.length} label={t("pageTitle")} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={query || levelId !== ALL ? t("noSearchResults") : t("noStudents")}
        />
      ) : (
        <>
          <DataShell>
            <StudentTable students={paginated} levels={levels} {...actions} />
          </DataShell>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
              <span className="tabular-nums">
                {safePage} / {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
