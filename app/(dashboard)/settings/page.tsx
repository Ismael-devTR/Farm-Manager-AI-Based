import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { isAdmin } from "@/lib/authorization";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import UserManagement from "@/components/UserManagement";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const t = getDictionary(locale).settings;

  const admin = isAdmin(session.role);

  const users = admin
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      {/* Change password — all users */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t.changePassword}</h2>
        <ChangePasswordForm />
      </section>

      {/* User management — admin only */}
      {admin && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t.userManagement}</h2>
          <UserManagement users={users} currentUserId={session.userId} />
        </section>
      )}
    </div>
  );
}
