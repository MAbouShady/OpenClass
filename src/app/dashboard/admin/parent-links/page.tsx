import { listParentLinks } from "@/modules/family/application/list-parent-links";
import { PrismaParentLinkRepository } from "@/modules/family/infrastructure/prisma-parent-link-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { ParentLinkForm } from "@/modules/family/presentation/parent-link-form";
import { ParentLinkRow } from "@/modules/family/presentation/parent-link-row";
import { createParentLinkAction, deleteParentLinkAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const parentLinkRepository = new PrismaParentLinkRepository();
const userRepository = new PrismaUserRepository();

export default async function ParentLinksAdminPage() {
  const links = await listParentLinks({ parentLinkRepository });
  const rows = await Promise.all(
    links.map(async (link) => {
      const [parent, student] = await Promise.all([
        userRepository.findById(link.parentId),
        userRepository.findById(link.studentId),
      ]);
      return {
        id: link.id,
        parentEmail: parent?.email ?? link.parentId,
        studentEmail: student?.email ?? link.studentId,
      };
    }),
  );

  return (
    <div className="max-w-[560px] mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Parent links</h1>
        <p className="text-sm text-muted-foreground">
          Link a parent account to their child&apos;s student account.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Add a link</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentLinkForm action={createParentLinkAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Existing links</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No links yet.</p>
          ) : (
            <div>
              {rows.map((row) => (
                <ParentLinkRow
                  key={row.id}
                  id={row.id}
                  parentEmail={row.parentEmail}
                  studentEmail={row.studentEmail}
                  deleteAction={deleteParentLinkAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
