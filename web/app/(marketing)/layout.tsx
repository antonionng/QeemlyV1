import type { ReactNode } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-background">
      <SiteNav />
      <main className="flex-1 min-w-0">
        <div className="responsive-page-shell responsive-page-gutters min-w-0 py-6 sm:py-8 lg:py-12">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
