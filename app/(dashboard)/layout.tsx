import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { LocaleProvider } from "@/components/LocaleProvider";
import ResponsiveLayout from "@/components/ResponsiveLayout";

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
      <ResponsiveLayout userName={session.name} locale={locale} dict={dict} role={session.role}>
        {children}
      </ResponsiveLayout>
    </LocaleProvider>
  );
}
