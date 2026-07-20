import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/modules/auth/presentation/auth-layout";
import { RegisterForm } from "@/modules/auth/presentation/register-form";
import { LinkText } from "@/components/common/link-text";
import { registerAction } from "@/app/register/actions";

export default async function RegisterPage() {
  if (process.env.REGISTRATION_ENABLED !== "true") redirect("/login");

  const session = await auth();
  if (session?.user.id) redirect(`/dashboard/${session.user.role.toLowerCase()}`);

  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <AuthLayout
      title={t("registerTitle")}
      description={t("registerDescription")}
      footer={
        <p className="text-sm text-muted-foreground text-center">
          {t("registerHasAccount")}{" "}
          <LinkText href="/login" className="font-medium text-foreground underline">
            {tCommon("signIn")}
          </LinkText>
        </p>
      }
    >
      <RegisterForm action={registerAction} />
    </AuthLayout>
  );
}
