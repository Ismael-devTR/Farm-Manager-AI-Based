"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory } from "@/app/generated/prisma/enums";

export type ActionState = { error?: string };

export async function addExpense(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const date = formData.get("date") as string;
  const category = formData.get("category") as ExpenseCategory;
  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!date || !category || !description || !amount) {
    return { error: "All required fields must be filled." };
  }

  await prisma.expense.create({
    data: { batchId, date: new Date(date), category, description, amount, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function deleteExpense(id: string, batchId: string): Promise<void> {
  await prisma.expense.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
