import { GraduationCap } from "lucide-react";

type StudentPortalShellProps = {
  readonly title: string;
  readonly children: React.ReactNode;
};

/** Public chrome for the portal — deliberately not the signed-in dashboard. */
export function StudentPortalShell({ title, children }: StudentPortalShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">OpenClass</span>
          <span className="mx-1 text-border">·</span>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
      </header>
      {children}
    </div>
  );
}
