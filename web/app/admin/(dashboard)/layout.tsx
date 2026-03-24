"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { ADMIN_NAV_GROUPS } from "@/lib/admin/navigation";

export default function AdminDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-2 text-text-primary lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col border-b border-border bg-surface-1 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
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
        <nav className="flex-1 overflow-x-auto p-3 lg:overflow-y-auto">
          <div className="flex min-w-0 flex-col gap-5">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {group.heading}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? "bg-brand-500 text-white shadow-sm"
                            : "text-text-secondary hover:bg-brand-50 hover:text-brand-600"
                        }`}
                      >
                        <item.icon className={`mt-0.5 h-4 w-4 ${active ? "text-white" : "text-brand-300"}`} />
                        <span className="min-w-0">
                          <span className="block font-medium">{item.label}</span>
                          {item.description ? (
                            <span className={`mt-0.5 block text-xs ${active ? "text-white/80" : "text-text-tertiary"}`}>
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-text-tertiary">Platform Administration</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="responsive-page-gutters min-w-0 flex-1 py-4 sm:py-6 lg:py-8">
        <div className="responsive-page-shell min-w-0">{children}</div>
      </main>
    </div>
  );
}
