import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { LevelRow, type LevelNode } from "@/modules/levels/presentation/level-row";
import { AddLevelModal } from "@/modules/levels/presentation/add-level-modal";
import {
  createTeacherLevelAction,
  deleteTeacherLevelAction,
  updateTeacherLevelAction,
} from "@/app/dashboard/teacher/levels/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { Level } from "@/modules/levels/domain/level";

const levelRepository = new PrismaLevelRepository();

function buildTree(levels: Level[]): LevelNode[] {
  const map = new Map<string, LevelNode>();
  for (const l of levels) map.set(l.id, { ...l, children: [] });

  const roots: LevelNode[] = [];
  for (const l of levels) {
    const node = map.get(l.id)!;
    if (!l.parentLevelId) {
      roots.push(node);
    } else {
      const parent = map.get(l.parentLevelId);
      if (parent) {
        (parent.children as Level[]).push(l);
      } else {
        roots.push(node);
      }
    }
  }

  return roots.sort((a, b) => a.order - b.order);
}

export default async function TeacherLevelsPage() {
  const session = await auth();
  if (!session?.user.id) redirect("/login");

  const [levels, t] = await Promise.all([
    listLevels({ levelRepository }, session.user.id),
    getTranslations("levels"),
  ]);

  const tree = buildTree(levels);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
        <AddLevelModal createAction={createTeacherLevelAction} />
      </div>

      {tree.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("progressionTitle")}</CardTitle>
            <CardDescription className="text-xs">{t("progressionSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-start gap-0">
                {tree.map((node, index) => (
                  <div key={node.id} className="flex items-start">
                    <div className="flex flex-col items-center gap-2 px-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                        {node.order}
                      </div>
                      <div className="max-w-[88px] text-center">
                        <p className="text-xs font-semibold leading-tight">{node.name}</p>
                        {node.children.length > 0 && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                            {node.children.length} {t("subLevels")}
                          </p>
                        )}
                        {node.description && node.children.length === 0 && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight line-clamp-2">
                            {node.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < tree.length - 1 && (
                      <div className="mt-4 h-px w-8 shrink-0 bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("existingLevels")}</CardTitle>
        </CardHeader>
        <CardContent>
          {tree.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLevels")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {tree.map((node) => (
                <LevelRow
                  key={node.id}
                  level={node}
                  updateAction={updateTeacherLevelAction}
                  deleteAction={deleteTeacherLevelAction}
                  createAction={createTeacherLevelAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
