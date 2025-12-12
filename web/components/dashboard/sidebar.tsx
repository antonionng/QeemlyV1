"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChartLine,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/benchmarks", label: "Benchmarks", icon: ChartLine },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl border border-border/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl md:block">
      <div className="flex items-center gap-2 rounded-2xl bg-brand-50/70 px-3 py-2 text-sm font-semibold text-brand-800 ring-1 ring-border/60">
        <LayoutDashboard className="h-4 w-4 text-brand-700" />
        Dashboard
      </div>
      <nav className="mt-4 flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-100/80 text-brand-900 ring-1 ring-brand-200/70"
                  : "text-brand-800/80 hover:bg-brand-50/70 hover:text-brand-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

