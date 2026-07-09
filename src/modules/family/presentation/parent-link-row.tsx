import { Button } from "@/components/ui/button";

type ParentLinkRowProps = {
  readonly id: string;
  readonly parentEmail: string;
  readonly studentEmail: string;
  readonly deleteAction: (id: string) => Promise<void>;
};

export function ParentLinkRow({ id, parentEmail, studentEmail, deleteAction }: ParentLinkRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <p className="text-sm">
        {parentEmail} → {studentEmail}
      </p>
      <form action={deleteAction.bind(null, id)}>
        <Button type="submit" size="sm" variant="destructive">
          Unlink
        </Button>
      </form>
    </div>
  );
}
