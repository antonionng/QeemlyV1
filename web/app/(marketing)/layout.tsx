import type { ReactNode } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />
      <main className="flex-1">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
