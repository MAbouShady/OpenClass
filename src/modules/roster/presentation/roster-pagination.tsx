import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | undefined>;
};

function buildHref(searchParams: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (k !== "rosterPage" && v) params.set(k, v);
  }
  params.set("rosterPage", String(page));
  return `?${params.toString()}`;
}

export function RosterPagination({ page, totalPages, total, searchParams }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 mt-1 border-t text-sm text-muted-foreground">
      <span>
        {page} / {totalPages} &nbsp;·&nbsp; {total} total
      </span>
      <div className="flex gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(searchParams, page - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <span className={buttonVariants({ variant: "outline", size: "sm" }) + " pointer-events-none opacity-40"}>
            <ChevronLeft size={14} />
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(searchParams, page + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className={buttonVariants({ variant: "outline", size: "sm" }) + " pointer-events-none opacity-40"}>
            <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
