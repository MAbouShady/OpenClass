import { cn } from "@/shared/lib/utils";

const TONES = {
  violet: "bg-violet-500/10 text-violet-600",
  sky: "bg-sky-500/10 text-sky-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  rose: "bg-rose-500/10 text-rose-600",
} as const;

type StatCardProps = {
  readonly label: string;
  readonly value: number | string;
  readonly icon: React.ReactNode;
  readonly tone?: keyof typeof TONES;
  /** Draws attention when the number is something to act on (unpaid, failed). */
  readonly emphasis?: boolean;
  readonly hint?: string;
};

/** A single figure, its meaning, and an icon — the dashboard's basic unit. */
export function StatCard({ label, value, icon, tone = "violet", emphasis, hint }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        emphasis && value !== 0 && "border-amber-500/40",
      )}
    >
      <div
        className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1.5 truncate text-sm text-muted-foreground">{label}</p>
        {hint ? <p className="truncate text-xs text-muted-foreground/70">{hint}</p> : null}
      </div>
    </div>
  );
}
