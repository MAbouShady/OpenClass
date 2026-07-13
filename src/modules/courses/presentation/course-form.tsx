"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SESSION_TYPES } from "@/modules/courses/domain/session-type";
import { PAYMENT_FREQUENCIES, PAYMENT_FREQUENCY_LABELS } from "@/modules/courses/domain/payment-frequency";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";
import { useTranslations } from "next-intl";

type CourseFormDefaults = {
  readonly id?: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly price?: number | null;
  readonly sessionType?: string;
  readonly paymentFrequency?: string;
  readonly levelId?: string;
};

type CourseFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly levels: readonly Level[];
  readonly defaultValues?: CourseFormDefaults;
  readonly submitLabel: string;
};

export function CourseForm({ action, levels, defaultValues, submitLabel }: CourseFormProps) {
  const t = useTranslations("courses");
  const [state, formAction, pending] = useActionState(action, {});
  const [sessionType, setSessionType] = useState(defaultValues?.sessionType ?? "ONLINE");
  const [paymentFrequency, setPaymentFrequency] = useState(defaultValues?.paymentFrequency ?? "MONTHLY");
  const [levelId, setLevelId] = useState(defaultValues?.levelId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t("titleLabel")}</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">{t("descriptionLabel")}</Label>
        <Input
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price">{t("priceLabel")}</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min={0}
          step={1}
          placeholder={t("pricePlaceholder")}
          defaultValue={defaultValues?.price ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t("sessionTypeLabel")}</Label>
          <input type="hidden" name="sessionType" value={sessionType} />
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SESSION_TYPES.map((st) => (
                <SelectItem key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("paymentFrequencyLabel")}</Label>
          <input type="hidden" name="paymentFrequency" value={paymentFrequency} />
          <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>{PAYMENT_FREQUENCY_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="levelId">{t("levelLabel")}</Label>
        <input type="hidden" name="levelId" value={levelId} />
        <Select value={levelId} onValueChange={setLevelId}>
          <SelectTrigger id="levelId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("saving") : submitLabel}
      </Button>
    </form>
  );
}
