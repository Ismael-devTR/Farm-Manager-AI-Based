"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth.actions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Dictionary, Locale } from "@/locales";

type Props = {
  userName: string;
  locale: Locale;
  dict: Dictionary;
  onClose?: () => void;
};

export default function Sidebar({ userName, locale, dict, onClose }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: dict.nav.dashboard },
    { href: "/batches", label: dict.nav.batches },
  ];

  return (
    <aside className="w-56 flex flex-col bg-green-900 text-white h-full min-h-screen">
      <div className="px-5 py-6 border-b border-green-800 flex items-start justify-between">
        <div>
          <p className="font-bold text-lg leading-tight">Farm Manager</p>
          <p className="text-green-300 text-xs mt-1 truncate">{userName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-green-300 hover:text-white mt-0.5 transition-colors" aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-700 text-white"
                  : "text-green-200 hover:bg-green-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-green-800 space-y-1">
        <LanguageSwitcher current={locale} />
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-green-200 hover:bg-green-800 hover:text-white transition-colors"
          >
            {dict.nav.signOut}
          </button>
        </form>
      </div>
    </aside>
  );
}
