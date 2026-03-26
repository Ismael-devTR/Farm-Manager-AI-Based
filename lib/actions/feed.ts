"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string };

export async function addFeedRecord(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const date = formData.get("date") as string;
  const feedType = formData.get("feedType") as string;
  const quantityKg = Number(formData.get("quantityKg"));
  const costPerKg = Number(formData.get("costPerKg"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!date || !feedType || !quantityKg || !costPerKg) {
    return { error: "All required fields must be filled." };
  }

  await prisma.feedRecord.create({
    data: { batchId, date: new Date(date), feedType, quantityKg, costPerKg, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function deleteFeedRecord(id: string, batchId: string): Promise<void> {
  await prisma.feedRecord.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
