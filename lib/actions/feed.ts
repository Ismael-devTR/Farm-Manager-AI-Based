"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { getSession } from "@/lib/session";
import { canWrite } from "@/lib/authorization";

export type ActionState = { error?: string; success?: boolean };

export async function addFeedRecord(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.feedForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const date = formData.get("date") as string;
  const feedType = formData.get("feedType") as string;
  const quantityKg = Number(formData.get("quantityKg"));
  const costPerKg = Number(formData.get("costPerKg"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!date || !feedType || !quantityKg || !costPerKg) {
    return { error: t.errorRequired };
  }

  await prisma.feedRecord.create({
    data: { batchId, date: new Date(`${date}T12:00:00`), feedType, quantityKg, costPerKg, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function updateFeedRecord(
  id: string,
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.feedForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const date = formData.get("date") as string;
  const feedType = formData.get("feedType") as string;
  const quantityKg = Number(formData.get("quantityKg"));
  const costPerKg = Number(formData.get("costPerKg"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!date || !feedType || !quantityKg || !costPerKg) {
    return { error: t.errorRequired };
  }

  await prisma.feedRecord.update({
    where: { id },
    data: { date: new Date(`${date}T12:00:00`), feedType, quantityKg, costPerKg, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return { success: true };
}

export async function deleteFeedRecord(id: string, batchId: string): Promise<void> {
  const session = await getSession();
  if (!session || !canWrite(session.role)) return;
  await prisma.feedRecord.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
