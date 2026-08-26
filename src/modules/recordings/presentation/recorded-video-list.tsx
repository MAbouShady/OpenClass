"use client";

import { useMemo, useState } from "react";
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
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  RecordedVideoRow,
  type RecordedVideoRowActions,
} from "@/modules/recordings/presentation/recorded-video-row";
import type { CourseOption } from "@/modules/recordings/presentation/recorded-video-form";
import type { RecordedVideoItem } from "@/modules/recordings/presentation/recorded-video-item";

const ALL = "__all__";

type RecordedVideoListProps = RecordedVideoRowActions & {
  readonly videos: readonly RecordedVideoItem[];
  readonly courses: readonly CourseOption[];
};

export function RecordedVideoList({ videos, courses, ...actions }: RecordedVideoListProps) {
  const t = useTranslations("recordings");
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return videos.filter((video) => {
      if (courseId !== ALL && video.courseId !== courseId) return false;
      if (status !== ALL && video.status !== status) return false;
      if (!needle) return true;
      return (
        video.title.toLowerCase().includes(needle) ||
        video.courseTitle.toLowerCase().includes(needle)
      );
    });
  }, [videos, query, courseId, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>

        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allCourses")}</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allStatuses")}</SelectItem>
            <SelectItem value="PUBLISHED">{t("statusPublished")}</SelectItem>
            <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {videos.length === 0 ? t("noVideos") : t("noMatches")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colTitle")}</TableHead>
              <TableHead>{t("colCourse")}</TableHead>
              <TableHead>{t("colOrder")}</TableHead>
              <TableHead>{t("colStatus")}</TableHead>
              <TableHead>{t("colProcessing")}</TableHead>
              <TableHead className="text-end">{t("colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((video) => (
              <RecordedVideoRow key={video.id} video={video} courses={courses} {...actions} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
