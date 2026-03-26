"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const locale = await getLocale();
  const t = getDictionary(locale).auth;

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: t.errorRequired };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: t.errorInvalid };

  const valid = await compare(password, user.passwordHash);
  if (!valid) return { error: t.errorInvalid };

  await createSession({ userId: user.id, email: user.email, name: user.name });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
