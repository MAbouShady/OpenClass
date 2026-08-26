import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PaymentList } from "@/app/dashboard/teacher/payments/payment-list";
import { PageHeader } from "@/components/common/page-header";
import { CreditCard } from "lucide-react";

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
      <PageHeader
        icon={<CreditCard className="h-5 w-5" />}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        tone="amber"
      />
      <Card>
        <CardContent className="pt-6">
          <PaymentList enrollments={enrollments} />
        </CardContent>
      </Card>
    </div>
  );
}
