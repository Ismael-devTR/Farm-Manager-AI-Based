"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import type { Dictionary, Locale } from "@/locales";

type Props = {
  children: React.ReactNode;
  userName: string;
  locale: Locale;
  dict: Dictionary;
};

export default function ResponsiveLayout({ children, userName, locale, dict }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — fixed, full height */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar userName={userName} locale={locale} dict={dict} />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar
              userName={userName}
              locale={locale}
              dict={dict}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-green-900 text-white px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="text-white p-1 rounded hover:bg-green-800 transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>
          <span className="font-bold text-sm">Farm Manager</span>
        </header>

        <main className="flex-1 bg-gray-50 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
