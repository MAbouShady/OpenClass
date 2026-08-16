import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { SecretaryRow } from "./secretary-row";
import { AddSecretaryForm } from "./add-secretary-form";
import { createSecretaryAction, deleteSecretaryAction } from "./actions";

const userRepository = new PrismaUserRepository();

export default async function TeacherSecretariesPage() {
  const session = await auth();
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) notFound();

  const teacherId = session.user.id;
  const [secretaries, t] = await Promise.all([
    userRepository.findSecretariesByTeacherId(teacherId),
    getTranslations("secretaries"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("addTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddSecretaryForm action={createSecretaryAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {secretaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noSecretaries")}</p>
          ) : (
            <div className="divide-y">
              {secretaries.map((s) => (
                <SecretaryRow
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  email={s.email ?? ""}
                  deleteAction={deleteSecretaryAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
