"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string };

export async function addWeightRecord(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const recordDate = formData.get("recordDate") as string;
  const weekNumber = Number(formData.get("weekNumber"));
  const totalWeight = Number(formData.get("totalWeight"));
  const animalCount = Number(formData.get("animalCount"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!recordDate || !weekNumber || !totalWeight || !animalCount) {
    return { error: "All required fields must be filled." };
  }

  const exists = await prisma.weightRecord.findUnique({
    where: { batchId_weekNumber: { batchId, weekNumber } },
  });
  if (exists) {
    return { error: `Week ${weekNumber} record already exists for this batch.` };
  }

  await prisma.weightRecord.create({
    data: { batchId, recordDate: new Date(recordDate), weekNumber, totalWeight, animalCount, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function deleteWeightRecord(id: string, batchId: string): Promise<void> {
  await prisma.weightRecord.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
