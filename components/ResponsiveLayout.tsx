"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import type { Dictionary, Locale } from "@/locales";

type Props = {
  children: React.ReactNode;
  userName: string;
  locale: Locale;
  dict: Dictionary;
  role: string;
};

export default function ResponsiveLayout({ children, userName, locale, dict, role }: Props) {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — fixed, full height */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar
          userName={userName}
          locale={locale}
          dict={dict}
          role={role}
          onChatToggle={() => setChatOpen((v) => !v)}
        />
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
              role={role}
              onClose={() => setOpen(false)}
              onChatToggle={() => {
                setOpen(false);
                setChatOpen((v) => !v);
              }}
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

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-green-700 text-white shadow-lg hover:bg-green-800 transition-colors"
          aria-label={dict.chat.title}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        dict={dict}
      />
    </div>
  );
}
