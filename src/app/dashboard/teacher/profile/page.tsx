import { auth } from "@/auth";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { ProfileForm } from "@/modules/auth/presentation/profile-form";
import { CopyBookingLink } from "@/modules/auth/presentation/copy-booking-link";
import { env } from "@/shared/config/env";
import { updateProfileAction } from "@/app/dashboard/teacher/profile/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const userRepository = new PrismaUserRepository();

export default async function TeacherProfilePage() {
  const session = await auth();
  const user = session ? await userRepository.findById(session.user.id) : null;

  return (
    <div className="max-w-md mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold mb-4">My profile</h1>
        <Card>
          <CardContent className="pt-6">
            <ProfileForm
              action={updateProfileAction}
              defaultValues={{ name: user?.name ?? "", bio: user?.bio ?? null }}
            />
          </CardContent>
        </Card>
      </div>

      {session ? (
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Your booking link</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Share this link with students so they can see your courses and sign up.
              </p>
              <CopyBookingLink url={`${env.NEXT_PUBLIC_APP_URL}/t/${session.user.id}`} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
