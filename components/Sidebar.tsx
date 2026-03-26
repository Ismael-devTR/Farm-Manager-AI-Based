"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth.actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/batches", label: "Batches" },
];

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-green-900 text-white min-h-screen">
      <div className="px-5 py-6 border-b border-green-800">
        <p className="font-bold text-lg leading-tight">Farm Manager</p>
        <p className="text-green-300 text-xs mt-1 truncate">{userName}</p>
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

      <div className="px-3 py-4 border-t border-green-800">
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-green-200 hover:bg-green-800 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
