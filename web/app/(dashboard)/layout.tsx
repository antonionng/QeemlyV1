import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-50 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/80 backdrop-blur-xl">
        <div className="shell">
          <div className="flex h-16 items-center justify-between gap-4">
            <Logo compact href="/dashboard" />
            <div className="flex items-center gap-2">
            <div className="hidden h-10 items-center gap-2 rounded-full bg-muted/70 px-3 ring-1 ring-border/70 md:flex">
              <Search className="h-4 w-4 text-brand-700" />
              <Input
                placeholder="Quick search"
                className="h-10 w-64 border-none bg-transparent px-0 text-sm shadow-none focus:border-transparent focus-visible:outline-none"
              />
            </div>
            <Button variant="ghost" className="h-10 w-10 rounded-full bg-white/70 p-0">
              <Bell className="h-4 w-4 text-brand-700" />
            </Button>
            <Link
              href="/"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 sm:inline-flex"
            >
              Marketing site
            </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="shell flex gap-6 pb-12 pt-6">
        <DashboardSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

