import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { LevelForm } from "@/modules/levels/presentation/level-form";
import { LevelRow } from "@/modules/levels/presentation/level-row";
import {
  createLevelAction,
  deleteLevelAction,
  updateLevelAction,
} from "@/app/dashboard/admin/levels/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const levelRepository = new PrismaLevelRepository();

export default async function LevelsAdminPage() {
  const levels = await listLevels({ levelRepository });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Levels</h1>
        <p className="text-muted-foreground">
          Manage the proficiency levels used to tag courses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a level</CardTitle>
        </CardHeader>
        <CardContent>
          <LevelForm action={createLevelAction} submitLabel="Add level" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing levels</CardTitle>
        </CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No levels yet.</p>
          ) : (
            <div>
              {levels.map((level) => (
                <LevelRow
                  key={level.id}
                  level={level}
                  updateAction={updateLevelAction}
                  deleteAction={deleteLevelAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
