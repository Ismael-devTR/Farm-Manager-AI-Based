import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { LocaleProvider } from "@/components/LocaleProvider";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <LocaleProvider dict={dict}>
      <div className="flex min-h-screen">
        <Sidebar userName={session.name} locale={locale} dict={dict} />
        <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
      </div>
    </LocaleProvider>
  );
}
