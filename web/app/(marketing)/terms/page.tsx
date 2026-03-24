import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Qeemly",
  description: "Commercial terms for using Qeemly's compensation intelligence platform across the UAE and GCC.",
};

const sections = [
  {
    title: "1. Agreement and scope",
    paragraphs: [
      "These Terms of Service govern access to and use of the Qeemly website, applications, analytics, benchmarking tools, and related services. By accessing or using the service, you agree to these Terms on behalf of yourself and, where applicable, the organization you represent.",
      "Qeemly is the commercial name used for the service. If an order form, proposal, or subscription agreement identifies a specific legal entity, that entity is the contracting party for the relevant subscription.",
    ],
  },
  {
    title: "2. Eligibility and authority",
    paragraphs: [
      "The service is intended for business and professional use. You must be legally able to enter into binding agreements and, if acting for an organization, have authority to bind that organization.",
      "You are responsible for ensuring that only authorized personnel use your account and workspace credentials.",
    ],
  },
  {
    title: "3. Accounts and security",
    bullets: [
      "Keep account credentials confidential and do not share access outside authorized teams.",
      "Promptly notify Qeemly if you suspect unauthorized access, credential compromise, or misuse.",
      "You are responsible for activity carried out through your account unless caused by Qeemly's breach of these Terms or a security failure within our control.",
    ],
  },
  {
    title: "4. Subscriptions, pilots, and early access",
    paragraphs: [
      "Qeemly may offer pilots, early access programs, paid subscriptions, custom enterprise terms, or other commercial arrangements. Commercial details such as pricing, billing cycles, seat counts, support scope, implementation, and service commitments are governed by the relevant order form, invoice, or written proposal.",
      "Beta, preview, pilot, and early access features may change more frequently, may have reduced functionality, and may be subject to additional usage restrictions while we continue to improve the service.",
    ],
  },
  {
    title: "5. Customer Data",
    paragraphs: [
      "Customers may upload compensation, workforce, job architecture, and other HR or finance-related information into Qeemly. The customer retains responsibility for the accuracy of Customer Data and for securing any employee notices, permissions, approvals, or lawful basis required to submit that data.",
      "Qeemly may process Customer Data only as needed to provide the service, perform support, maintain security, develop agreed functionality, comply with law, and otherwise act under the customer's instructions and contract.",
    ],
  },
  {
    title: "6. Acceptable use",
    bullets: [
      "Do not use the service in a way that is unlawful, misleading, fraudulent, discriminatory, abusive, or infringing.",
      "Do not attempt to gain unauthorized access to the service, other customer environments, or Qeemly systems.",
      "Do not reverse engineer, scrape at scale, disrupt, overload, or probe the service except where expressly permitted by law and only after giving prior written notice if legally required.",
      "Do not use the service to build or train a competing dataset or product using Qeemly outputs or platform access in breach of these Terms.",
    ],
  },
  {
    title: "7. Confidentiality",
    paragraphs: [
      "Each party may receive confidential information from the other party, including business plans, customer lists, pricing, product details, benchmark methodology, compensation records, and security practices. The receiving party must protect confidential information with reasonable care and use it only for the permitted business relationship.",
      "Confidentiality obligations do not apply to information that becomes public without breach, was already lawfully known, is independently developed without use of the confidential information, or must be disclosed by law.",
    ],
  },
  {
    title: "8. Intellectual property and outputs",
    paragraphs: [
      "Qeemly and its licensors retain all rights in the platform, software, documentation, interfaces, methodology, branding, and related intellectual property. No ownership is transferred under these Terms.",
      "Customers retain rights in their Customer Data. Subject to payment and compliance with these Terms, Qeemly grants customers a limited, non-exclusive, non-transferable right to access and use the service and its outputs for internal business purposes.",
    ],
  },
  {
    title: "9. Benchmarking outputs and decisions",
    paragraphs: [
      "Qeemly provides data products, analytics, workflow tools, and benchmarking outputs designed to support compensation decision-making. Customers remain responsible for employment, payroll, tax, legal, immigration, regulatory, and human resources decisions made using the service.",
      "The service does not constitute legal advice, tax advice, investment advice, or a guarantee that a compensation approach is compliant in every jurisdiction, sector, or factual scenario.",
    ],
  },
  {
    title: "10. Fees and payment",
    paragraphs: [
      "Fees, invoicing terms, billing schedules, taxes, payment deadlines, and refund rules are governed by the applicable commercial agreement. Unless otherwise agreed in writing, fees are due in the stated currency and are non-refundable once the relevant service period has started.",
      "Qeemly may suspend access for materially overdue undisputed amounts after giving reasonable notice and an opportunity to cure.",
    ],
  },
  {
    title: "11. Suspension and termination",
    paragraphs: [
      "Qeemly may suspend or restrict access where necessary to address security risks, unlawful activity, repeated misuse, or material breach of these Terms.",
      "Either party may terminate a subscription or service relationship as allowed by the applicable commercial agreement. Upon termination, rights to use the service end except to the extent continued access or export support is expressly agreed for transition purposes.",
    ],
  },
  {
    title: "12. Warranties and disclaimers",
    paragraphs: [
      "Qeemly will provide the service with reasonable care and skill consistent with a business SaaS platform. Except as expressly stated in a written agreement, the service is provided on an 'as is' and 'as available' basis.",
      "To the maximum extent permitted by law, Qeemly disclaims implied warranties including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    title: "13. Liability",
    paragraphs: [
      "To the maximum extent permitted by law, neither party will be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including lost profits, lost revenue, lost business opportunity, or loss of goodwill.",
      "To the maximum extent permitted by law, Qeemly's aggregate liability arising out of or related to the service will not exceed the fees paid or payable by the customer to Qeemly for the twelve-month period immediately preceding the event giving rise to the claim, except where a different cap is stated in the applicable commercial agreement or where liability cannot be limited by law.",
    ],
  },
  {
    title: "14. Governing law and disputes",
    paragraphs: [
      "Unless a customer contract states otherwise, these Terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai, without regard to conflict of law principles.",
      "The courts of Dubai will have jurisdiction over disputes arising from or related to these Terms, unless mandatory law requires a different forum or the parties agree a different venue in writing.",
    ],
  },
  {
    title: "15. Changes and contact",
    paragraphs: [
      "Qeemly may update these Terms from time to time. Material changes will apply prospectively from the effective date shown on the updated version, and continued use of the service after that date means you accept the revised Terms.",
      "If you have questions about these Terms, contact hello@qeemly.com or use our contact page.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Legal</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">Terms of Service</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-brand-700">
          Effective date: {new Date().toLocaleDateString("en-GB")}. These terms are written for a UAE-based B2B SaaS
          platform supporting compensation workflows across the GCC.
        </p>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-brand-50/40 px-6 py-6 text-sm leading-7 text-brand-800 sm:px-10">
        These terms are commercial platform terms, not an employment contract. Any order form, enterprise agreement, or
        proposal signed with Qeemly will take priority over these website terms where the documents conflict.
      </section>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[2rem] border border-border/70 bg-white px-6 py-8 shadow-sm sm:px-10">
            <h2 className="text-2xl font-semibold text-brand-900">{section.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-brand-700 sm:text-[15px]">
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets ? (
                <ul className="space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-[2rem] border border-border/70 bg-white px-6 py-8 shadow-sm sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-900">Contact us</h2>
        <p className="mt-4 text-sm leading-7 text-brand-700 sm:text-[15px]">
          Email <a className="font-semibold text-brand-800" href="mailto:hello@qeemly.com">hello@qeemly.com</a> or visit{" "}
          <Link href="/contact" className="font-semibold text-brand-800 underline underline-offset-4">
            our contact page
          </Link>{" "}
          for commercial or legal questions about the service.
        </p>
      </section>
    </div>
  );
}
