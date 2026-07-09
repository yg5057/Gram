"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "📅", label: "캘린더" },
  { href: "/compare", icon: "📊", label: "비교" },
  { href: "/me", icon: "👤", label: "내정보" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-[84px] w-full max-w-[430px] items-start border-t border-line bg-white pt-3">
      {TABS.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 text-center ${active ? "" : "opacity-40"}`}
          >
            <div className="text-[22px] leading-none">{tab.icon}</div>
            <div
              className={`mt-1 text-[11px] ${
                active ? "font-bold text-main" : "font-semibold text-sub"
              }`}
            >
              {tab.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
