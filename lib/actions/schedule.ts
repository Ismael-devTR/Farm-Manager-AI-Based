"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ScheduleType } from "@/app/generated/prisma/enums";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { getSession } from "@/lib/session";
import { canWrite } from "@/lib/authorization";

export type ActionState = { error?: string; success?: boolean };

export async function addSchedule(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.scheduleForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const scheduledDate = formData.get("scheduledDate") as string;
  const type = formData.get("type") as ScheduleType;
  const product = formData.get("product") as string;
  const notes = (formData.get("notes") as string) || undefined;

  if (!scheduledDate || !type || !product) {
    return { error: t.errorRequired };
  }

  await prisma.vaccinationSchedule.create({
    data: { batchId, scheduledDate: new Date(`${scheduledDate}T12:00:00`), type, product, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function toggleScheduleComplete(id: string, batchId: string, completed: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !canWrite(session.role)) return;
  await prisma.vaccinationSchedule.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  revalidatePath(`/batches/${batchId}`);
}

export async function updateSchedule(
  id: string,
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.scheduleForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const scheduledDate = formData.get("scheduledDate") as string;
  const type = formData.get("type") as ScheduleType;
  const product = formData.get("product") as string;
  const notes = (formData.get("notes") as string) || undefined;

  if (!scheduledDate || !type || !product) {
    return { error: t.errorRequired };
  }

  await prisma.vaccinationSchedule.update({
    where: { id },
    data: { scheduledDate: new Date(`${scheduledDate}T12:00:00`), type, product, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return { success: true };
}

export async function deleteSchedule(id: string, batchId: string): Promise<void> {
  const session = await getSession();
  if (!session || !canWrite(session.role)) return;
  await prisma.vaccinationSchedule.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
