import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export type Role = "ADMIN" | "EDITOR" | "VIEWER";

/** Read session and redirect to /dashboard if user's role is not in the allowed list. */
export async function requireRole(...roles: Role[]): Promise<{ userId: string; role: Role }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role as Role)) redirect("/dashboard");
  return { userId: session.userId, role: session.role as Role };
}

/** Returns the current user's role from the session, or null if not logged in. */
export async function getRole(): Promise<Role | null> {
  const session = await getSession();
  if (!session) return null;
  return session.role as Role;
}

export function canWrite(role: string): boolean {
  return role !== "VIEWER";
}

export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}
