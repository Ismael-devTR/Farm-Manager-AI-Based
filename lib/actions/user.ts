"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { UserRole } from "@/app/generated/prisma/enums";

export type ActionState = { error?: string; success?: string };

export async function changeOwnPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).settings;

  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: getDictionary(locale).batchForm.errorRequired };
  }

  if (newPassword.length < 6) return { error: t.errorPasswordTooShort };
  if (newPassword !== confirmPassword) return { error: t.errorPasswordMismatch };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "Unauthorized" };

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) return { error: t.errorCurrentPassword };

  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash },
  });

  return { success: t.passwordChanged };
}

export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).settings;

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: getDictionary(locale).common.errorUnauthorized };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as UserRole;

  if (!name || !email || !password || !role) {
    return { error: getDictionary(locale).batchForm.errorRequired };
  }

  if (password.length < 6) return { error: t.errorPasswordTooShort };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: `Email already in use.` };

  const passwordHash = await hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  revalidatePath("/settings");
  return { success: t.userCreated };
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).settings;

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: getDictionary(locale).common.errorUnauthorized };
  }

  // Prevent demoting the last admin
  if (role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "ADMIN" && adminCount <= 1) {
      return { error: t.errorLastAdmin };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  // If the admin changed their own role, refresh session
  if (userId === session.userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
    }
  }

  revalidatePath("/settings");
  return { success: t.roleUpdated };
}

export async function resetUserPassword(
  userId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).settings;

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: getDictionary(locale).common.errorUnauthorized };
  }

  const newPassword = formData.get("newPassword") as string;
  if (!newPassword) return { error: getDictionary(locale).batchForm.errorRequired };
  if (newPassword.length < 6) return { error: t.errorPasswordTooShort };

  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: t.passwordReset };
}

export async function deleteUser(userId: string): Promise<ActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale).settings;

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: getDictionary(locale).common.errorUnauthorized };
  }

  if (userId === session.userId) return { error: t.errorSelfDelete };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return { error: t.errorLastAdmin };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings");
  return {};
}
