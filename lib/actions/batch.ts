"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BatchStatus } from "@/app/generated/prisma/enums";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";

export type ActionState = { error?: string; batchId?: string };

export async function createBatch(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).batchForm;

  const name = formData.get("name") as string;
  const entryDate = formData.get("entryDate") as string;
  const animalCount = Number(formData.get("animalCount"));
  const birthWeeks = Number(formData.get("birthWeeks"));
  const initialWeight = Number(formData.get("initialWeight"));
  const costPerAnimal = Number(formData.get("costPerAnimal"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!name || !entryDate || !animalCount || !birthWeeks || !initialWeight || !costPerAnimal) {
    return { error: t.errorRequired };
  }

  const batch = await prisma.batch.create({
    data: { name, entryDate: new Date(`${entryDate}T12:00:00`), animalCount, birthWeeks, initialWeight, costPerAnimal, notes },
  });

  revalidatePath("/batches");
  return { batchId: batch.id };
}

export async function updateBatchStatus(batchId: string, status: BatchStatus): Promise<void> {
  await prisma.batch.update({ where: { id: batchId }, data: { status } });
  revalidatePath(`/batches/${batchId}`);
  revalidatePath("/batches");
}

export async function deleteBatch(batchId: string): Promise<void> {
  await prisma.$transaction([
    prisma.vaccinationSchedule.deleteMany({ where: { batchId } }),
    prisma.expense.deleteMany({ where: { batchId } }),
    prisma.feedRecord.deleteMany({ where: { batchId } }),
    prisma.weightRecord.deleteMany({ where: { batchId } }),
    prisma.batch.delete({ where: { id: batchId } }),
  ]);
  revalidatePath("/batches");
  redirect("/batches");
}
