import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PaymentList } from "@/app/dashboard/teacher/payments/payment-list";

const paymentRepository = new PrismaPaymentRepository();

export default async function PaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") notFound();

  const [enrollments, t] = await Promise.all([
    paymentRepository.findEnrollmentSummariesForTeacher(session.user.id),
    getTranslations("payments"),
  ]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("pageSubtitle")}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <PaymentList enrollments={enrollments} />
        </CardContent>
      </Card>
    </div>
  );
}
