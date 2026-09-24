"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "./page-size";

const SELECT_CLASS =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The report's pagination row: a "records per page" select (always shown once there are rows) plus, only when
 * more than one page exists, a "Page X of Y" label with previous/next links.
 *
 * @param props.hasRows - Whether the report has any rows at all; renders nothing when it doesn't.
 * @param props.pageSize - Current "records per page" selection.
 * @param props.page / totalPages - Current position; the prev/next group is hidden when `totalPages <= 1`.
 * @param props.query - Every other active filter, forwarded unchanged when the page or page size changes.
 */
export function PaginationBar(props: {
  readonly hasRows: boolean;
  readonly pageSize: PageSizeOption;
  readonly pageSizeLabel: string;
  readonly allLabel: string;
  readonly page: number;
  readonly totalPages: number;
  readonly query: Readonly<Record<string, string | undefined>>;
  readonly pageLabel: string;
  readonly prev: string;
  readonly next: string;
}) {
  const {
    hasRows,
    pageSize,
    pageSizeLabel,
    allLabel,
    page,
    totalPages,
    query,
    pageLabel,
    prev,
    next,
  } = props;
  const router = useRouter();

  if (!hasRows) return null;

  // Builds the next URL from the `query` prop (the filters already active on the page) plus overrides — no
  // useSearchParams() needed, which in a Client Component only works wrapped in <Suspense>.
  // Keeps a key whose value is "" (an explicitly cleared filter, e.g. from=&to= meaning "all time") — dropping
  // it here would silently revert that explicit choice back to the report's current-month default.
  const hrefFor = (overrides: Readonly<Record<string, string>>) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([k, v]) => !(k in overrides) && v !== undefined) as [
        string,
        string,
      ][],
    );
    for (const [k, v] of Object.entries(overrides)) params.set(k, v);
    return `?${params.toString()}`;
  };
  const btn = buttonVariants({ variant: "outline", size: "sm" });
  const off = `${btn} pointer-events-none opacity-40`;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <label className="flex items-center gap-2">
        {pageSizeLabel}
        <select
          value={pageSize}
          onChange={(e) => {
            // A different page size shifts what "page 2" even means, so always land back on page 1.
            router.push(hrefFor({ pageSize: e.target.value, page: "1" }), { scroll: false });
          }}
          className={SELECT_CLASS}
        >
          {PAGE_SIZE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o === "all" ? allLabel : o}
            </option>
          ))}
        </select>
      </label>

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <span>{pageLabel}</span>
          <div className="flex gap-1">
            {page > 1 ? (
              <Link
                href={hrefFor({ page: String(page - 1) })}
                scroll={false}
                className={btn}
                aria-label={prev}
              >
                <ChevronLeft size={14} className="rtl:rotate-180" />
              </Link>
            ) : (
              <span className={off}>
                <ChevronLeft size={14} className="rtl:rotate-180" />
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={hrefFor({ page: String(page + 1) })}
                scroll={false}
                className={btn}
                aria-label={next}
              >
                <ChevronRight size={14} className="rtl:rotate-180" />
              </Link>
            ) : (
              <span className={off}>
                <ChevronRight size={14} className="rtl:rotate-180" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
