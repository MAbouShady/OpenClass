import { cn } from "@/shared/lib/utils";

type DataShellProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
};

/**
 * Frame for a dense data surface (a table). Keeps the border, rounding and
 * overflow behaviour identical wherever rows are listed, and lets wide tables
 * scroll inside the frame instead of pushing the page sideways.
 */
export function DataShell({ children, className }: DataShellProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

type ToolbarProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
};

/** Search + filters row. Sits above a DataShell or a card grid. */
export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      {children}
    </div>
  );
}

type ResultCountProps = {
  readonly shown: number;
  readonly total: number;
  readonly label: string;
};

/** Quiet "12 of 340" marker so filtering never hides how much was filtered out. */
export function ResultCount({ shown, total, label }: ResultCountProps) {
  if (shown === total) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {shown} / {total} {label}
    </p>
  );
}
