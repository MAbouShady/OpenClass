import { auth } from "@/auth";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { ProfileForm } from "@/modules/auth/presentation/profile-form";
import { CopyBookingLink } from "@/modules/auth/presentation/copy-booking-link";
import { env } from "@/shared/config/env";
import { updateProfileAction } from "@/app/dashboard/teacher/profile/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";

const userRepository = new PrismaUserRepository();

export default async function TeacherProfilePage() {
  const [session, t] = await Promise.all([auth(), getTranslations("profile")]);
  const user = session ? await userRepository.findById(session.user.id) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        {session && (
          <a
            href={`/t/${session.user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink size={14} />
            {t("previewLabel")}
          </a>
        )}
      </div>

      {/* Profile editor */}
      <Card>
        <CardContent className="pt-6">
          <ProfileForm
            action={updateProfileAction}
            defaultValues={{
              name: user?.name ?? "",
              bio: user?.bio ?? null,
              photoUrl: user?.photoUrl ?? null,
              coverUrl: user?.coverUrl ?? null,
              coverOffsetY: user?.coverOffsetY ?? 50,
              accentColor: user?.accentColor ?? null,
              paymentDetails: user?.paymentDetails ?? null,
              locale: user?.locale ?? "en",
            }}
          />
        </CardContent>
      </Card>

      {/* Booking link */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">{t("bookingLinkTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t("bookingLinkDesc")}</p>
            <CopyBookingLink url={`${env.NEXT_PUBLIC_APP_URL}/t/${session.user.id}`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
