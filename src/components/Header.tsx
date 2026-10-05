"use client";

import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions";

const PAGES = [
  { href: "/", label: "Weekly Calendar" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/year", label: "Year at a Glance" },
  { href: "/debrief", label: "Debrief" },
  { href: "/settings", label: "Settings" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const current = PAGES.find((p) => p.href === pathname)?.href ?? "/";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 md:px-6">
      <label className="relative">
        <span className="sr-only">Page</span>
        <select
          value={current}
          onChange={(e) => router.push(e.target.value)}
          className="cursor-pointer appearance-none rounded-md bg-transparent py-1 pr-6 text-[15px] font-medium tracking-tight outline-none"
        >
          {PAGES.map((p) => (
            <option key={p.href} value={p.href}>
              {p.label}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </label>
      <form action={logout}>
        <button className="text-sm text-muted hover:text-text">Sign out</button>
      </form>
    </header>
  );
}
