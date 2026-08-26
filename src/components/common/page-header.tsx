import { cn } from "@/shared/lib/utils";

/** Accent tones for the icon tile, so sections stay recognisable at a glance. */
const TONES = {
  violet: "bg-violet-500/10 text-violet-600",
  sky: "bg-sky-500/10 text-sky-600",
  indigo: "bg-indigo-500/10 text-indigo-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  rose: "bg-rose-500/10 text-rose-600",
  slate: "bg-slate-500/10 text-slate-600",
} as const;

export type HeaderTone = keyof typeof TONES;

type PageHeaderProps = {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly tone?: HeaderTone;
  /** Primary action(s), rendered at the far end of the header. */
  readonly actions?: React.ReactNode;
};

/**
 * The single page-title treatment for the whole dashboard. Every screen gets
 * the same rhythm — tile, title, one line of context, actions — so moving
 * between sections never feels like moving between applications.
 */
export function PageHeader({ icon, title, subtitle, tone = "violet", actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            TONES[tone],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
