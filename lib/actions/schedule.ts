"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ScheduleType } from "@/app/generated/prisma/enums";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";

export type ActionState = { error?: string };

export async function addSchedule(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).scheduleForm;

  const scheduledDate = formData.get("scheduledDate") as string;
  const type = formData.get("type") as ScheduleType;
  const product = formData.get("product") as string;
  const notes = (formData.get("notes") as string) || undefined;

  if (!scheduledDate || !type || !product) {
    return { error: t.errorRequired };
  }

  await prisma.vaccinationSchedule.create({
    data: { batchId, scheduledDate: new Date(scheduledDate), type, product, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function toggleScheduleComplete(id: string, batchId: string, completed: boolean): Promise<void> {
  await prisma.vaccinationSchedule.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  revalidatePath(`/batches/${batchId}`);
}

export async function deleteSchedule(id: string, batchId: string): Promise<void> {
  await prisma.vaccinationSchedule.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
