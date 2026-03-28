"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory } from "@/app/generated/prisma/enums";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { getSession } from "@/lib/session";
import { canWrite } from "@/lib/authorization";

export type ActionState = { error?: string; success?: boolean };

export async function addExpense(
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.expenseForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const date = formData.get("date") as string;
  const category = formData.get("category") as ExpenseCategory;
  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!date || !category || !description || !amount) {
    return { error: t.errorRequired };
  }

  await prisma.expense.create({
    data: { batchId, date: new Date(`${date}T12:00:00`), category, description, amount, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return {};
}

export async function updateExpense(
  id: string,
  batchId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.expenseForm;

  const session = await getSession();
  if (!session || !canWrite(session.role)) return { error: dict.common.errorUnauthorized };

  const date = formData.get("date") as string;
  const category = formData.get("category") as ExpenseCategory;
  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const notes = (formData.get("notes") as string) || undefined;

  if (!date || !category || !description || !amount) {
    return { error: t.errorRequired };
  }

  await prisma.expense.update({
    where: { id },
    data: { date: new Date(`${date}T12:00:00`), category, description, amount, notes },
  });

  revalidatePath(`/batches/${batchId}`);
  return { success: true };
}

export async function deleteExpense(id: string, batchId: string): Promise<void> {
  const session = await getSession();
  if (!session || !canWrite(session.role)) return;
  await prisma.expense.delete({ where: { id } });
  revalidatePath(`/batches/${batchId}`);
}
