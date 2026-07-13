import { getTranslations } from "next-intl/server";
import { listParentLinks } from "@/modules/family/application/list-parent-links";
import { PrismaParentLinkRepository } from "@/modules/family/infrastructure/prisma-parent-link-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { ParentLinkRow } from "@/modules/family/presentation/parent-link-row";
import { AddParentLinkModal } from "@/modules/family/presentation/add-parent-link-modal";
import { createParentLinkAction, deleteParentLinkAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";

const parentLinkRepository = new PrismaParentLinkRepository();
const userRepository = new PrismaUserRepository();

export default async function ParentLinksAdminPage() {
  const [links, t] = await Promise.all([
    listParentLinks({ parentLinkRepository }),
    getTranslations("parentLinks"),
  ]);

  const rows = await Promise.all(
    links.map(async (link) => {
      const [parent, student] = await Promise.all([
        userRepository.findById(link.parentId),
        userRepository.findById(link.studentId),
      ]);
      return {
        id: link.id,
        parentEmail: parent?.email ?? parent?.name ?? link.parentId,
        studentEmail: student?.email ?? student?.name ?? link.studentId,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
        <AddParentLinkModal createAction={createParentLinkAction} />
      </div>

      {/* Links list */}
      <Card>
        <CardHeader>
          <CardTitle>{t("existingLinks")}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLinks")}</p>
          ) : (
            <div className="divide-y">
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
