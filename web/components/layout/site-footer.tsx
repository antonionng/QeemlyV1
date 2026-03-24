import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PilotApplicationModal } from "@/components/marketing/pilot-application-modal";

const getStartedLinks = [
  { label: "Early access", href: "/register" },
  { label: "Book a demo", href: "/contact" },
  { label: "Log in", href: "/login" },
] as const;

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

const footerHighlights = [
  "Live UAE benchmark coverage",
  "Approval-ready exports for HR and finance",
  "Built for founders, HR, and finance teams",
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#111233] text-white">
      <div className="mx-auto w-full max-w-[90rem] px-6 pb-10 pt-8 sm:px-10 lg:px-20 lg:pb-12 lg:pt-10">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(92,69,253,0.55),_rgba(92,69,253,0)_34%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(8,10,30,0.42)]">
          <div className="px-8 py-10 sm:px-10 lg:px-12 lg:py-12">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] xl:items-end">
              <div className="max-w-[38rem]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a89bff]">
                  Gulf compensation intelligence
                </p>
                <h2 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl">
                  Bring clarity to every compensation decision.
                </h2>
                <p className="mt-5 max-w-[34rem] text-base leading-7 text-white/76 sm:text-lg">
                  Benchmark pay, align leadership, and move faster with salary data built for the UAE and the wider GCC.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {footerHighlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium leading-6 text-white/80 backdrop-blur-sm"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-8">
              <PilotApplicationModal
                sourceCta="footer"
                triggerClassName="inline-flex h-14 items-center justify-center rounded-full bg-[#28e7c5] px-8 text-base font-semibold tracking-[0.02em] text-[#111233] shadow-[0_12px_40px_rgba(40,231,197,0.22)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
              <Link
                href="/contact"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white/15 bg-transparent px-8 text-base font-semibold tracking-[0.02em] text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Book a demo
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div className="max-w-[24rem]">
                <Link href="/home" className="inline-flex items-center">
                  <Image
                    src="/images/marketing/home/logo-white.svg"
                    alt="Qeemly"
                    width={163}
                    height={64}
                    unoptimized
                    className="h-12 w-auto"
                  />
                </Link>
                <p className="mt-5 text-sm leading-7 text-white/72">
                  For teams building pay confidence in the UAE and across the GCC. Fast answers for hiring, salary reviews, and executive approvals.
                </p>
                <a
                  href="mailto:hello@qeemly.com"
                  className="mt-6 inline-flex text-sm font-semibold text-[#28e7c5] transition-colors hover:text-white"
                >
                  hello@qeemly.com
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a89bff]">
                  Get Started
                </h3>
                <ul className="mt-5 space-y-3">
                  {getStartedLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm leading-6 text-white/72 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/56 md:flex-row md:items-center md:justify-between">
              <p>&copy; {new Date().getFullYear()} Qeemly. Built for pay clarity across the UAE and GCC.</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {legalLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
