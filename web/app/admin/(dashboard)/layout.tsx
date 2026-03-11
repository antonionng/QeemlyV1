"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  Shield,
  Database,
  Clock,
  FileJson,
  BarChart3,
  GitBranch,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/logo";

const nav = [
  { href: "/admin", label: "Control Tower", icon: Activity },
  { href: "/admin/insights", label: "Insights", icon: TrendingUp },
  { href: "/admin/pipeline", label: "Data Pipeline", icon: GitBranch },
  { href: "/admin/sources", label: "Sources", icon: Database },
  { href: "/admin/benchmarks", label: "Benchmarks", icon: BarChart3 },
  { href: "/admin/freshness", label: "Freshness", icon: Clock },
  { href: "/admin/snapshots", label: "Snapshots", icon: FileJson },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
];

export default function AdminDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-surface-2 text-text-primary">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-surface-1">
        {/* Logo area */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <Logo compact href="/admin" />
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-text-secondary hover:bg-brand-50 hover:text-brand-600"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-white" : "text-brand-300"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-text-tertiary">Platform Administration</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
