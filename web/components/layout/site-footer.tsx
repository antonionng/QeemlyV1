import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = {
  product: [
    { label: "Benchmark Search", href: "/search" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "/pricing" },
  ],
  company: [
    { label: "About", href: "/contact" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/contact" },
  ],
  resources: [
    { label: "Guides", href: "/contact" },
    { label: "API Docs", href: "/contact" },
    { label: "Changelog", href: "/contact" },
  ],
  legal: [
    { label: "Privacy", href: "/contact" },
    { label: "Terms", href: "/contact" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-12">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-600">
              Real-time Gulf compensation intelligence for teams that need clarity, confidence, and speed.
            </p>
            <p className="mt-6 text-sm text-brand-500">
              <a href="mailto:hello@qeemly.com" className="hover:text-brand-800">
                hello@qeemly.com
              </a>
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-400">Product</div>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-brand-700 hover:text-brand-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-400">Company</div>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-brand-700 hover:text-brand-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-400">Resources</div>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-brand-700 hover:text-brand-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          </div>

        {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-brand-500 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Qeemly. All rights reserved.</p>
            <div className="flex gap-6">
              {footerLinks.legal.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-brand-800">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
