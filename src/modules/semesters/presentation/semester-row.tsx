import { Button } from "@/components/ui/button";
import type { Semester } from "@/modules/semesters/domain/semester";

type SemesterRowProps = {
  readonly semester: Semester;
  readonly deleteAction: (id: string) => Promise<void>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function SemesterRow({ semester, deleteAction }: SemesterRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <p className="text-sm">
        {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
      </p>
      <form action={deleteAction.bind(null, semester.id)}>
        <Button type="submit" size="sm" variant="destructive">
          Delete
        </Button>
      </form>
    </div>
  );
}
