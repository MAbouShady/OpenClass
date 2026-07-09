import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  readonly action: () => Promise<void>;
  readonly label: string;
};

export function SignOutButton({ action, label }: SignOutButtonProps) {
  return (
    <form action={action}>
      <Button type="submit" variant="ghost">
        <LogOut className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
