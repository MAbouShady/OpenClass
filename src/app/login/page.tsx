import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/modules/auth/presentation/auth-layout";
import { LoginForm } from "@/modules/auth/presentation/login-form";
import { LinkText } from "@/components/common/link-text";
import { loginAction } from "@/app/login/actions";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user.id) redirect(`/dashboard/${session.user.role.toLowerCase()}`);

  const registrationEnabled = process.env.REGISTRATION_ENABLED === "true";
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <AuthLayout
      title={t("loginTitle")}
      description={t("loginDescription")}
      footer={
        registrationEnabled ? (
          <p className="text-sm text-muted-foreground text-center">
            {t("loginNoAccount")}{" "}
            <LinkText href="/register" className="font-medium text-foreground underline">
              {tCommon("register")}
            </LinkText>
          </p>
        ) : null
      }
    >
      <LoginForm action={loginAction} />
    </AuthLayout>
  );
}
