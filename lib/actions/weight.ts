"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { getSession } from "@/lib/session";
import { canWrite } from "@/lib/authorization";

export type ActionState = { error?: string; success?: boolean };

export async function addWeightRecord(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.weightForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const recordDate = formData.get("recordDate") as string;
  const weekNumber = Number(formData.get("weekNumber"));
  const totalWeight = Number(formData.get("totalWeight"));
  const animalCount = Number(formData.get("animalCount"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!recordDate || !weekNumber || !totalWeight || !animalCount) {
    return { error: t.errorRequired };
  }

  const exists = await prisma.weightRecord.findUnique({
    where: { batchId_weekNumber: { batchId, weekNumber } },
  });
  if (exists) {
    return { error: t.errorDuplicate.replace("{week}", String(weekNumber)) };
  }

  await prisma.weightRecord.create({
    data: { batchId, recordDate: new Date(`${recordDate}T12:00:00`), weekNumber, totalWeight, animalCount, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function updateWeightRecord(
  id: string,
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.weightForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const recordDate = formData.get("recordDate") as string;
  const weekNumber = Number(formData.get("weekNumber"));
  const totalWeight = Number(formData.get("totalWeight"));
  const animalCount = Number(formData.get("animalCount"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!recordDate || !weekNumber || !totalWeight || !animalCount) {
    return { error: t.errorRequired };
  }

  const exists = await prisma.weightRecord.findUnique({
    where: { batchId_weekNumber: { batchId, weekNumber } },
  });
  if (exists && exists.id !== id) {
    return { error: t.errorDuplicate.replace("{week}", String(weekNumber)) };
  }

  await prisma.weightRecord.update({
    where: { id },
    data: { recordDate: new Date(`${recordDate}T12:00:00`), weekNumber, totalWeight, animalCount, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return { success: true };
}

export async function deleteWeightRecord(id: string, batchId: string): Promise<void> {
  const session = await getSession();
  if (!session || !canWrite(session.role)) return;
  await prisma.weightRecord.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
