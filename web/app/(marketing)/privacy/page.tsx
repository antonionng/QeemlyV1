import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Qeemly",
  description: "How Qeemly collects, uses, stores, and protects personal data across the UAE and GCC.",
};

const sections = [
  {
    title: "1. Scope",
    paragraphs: [
      "This Privacy Policy explains how Qeemly collects, uses, stores, shares, and protects personal data when people visit our website, request a demo, create an account, or use Qeemly's compensation intelligence platform in the UAE and across the GCC.",
      "Qeemly is a business-focused software service. In many cases, our customers submit workforce and compensation-related information to us so they can benchmark pay, manage approvals, and run compensation workflows. Where a customer uploads employee or contractor information into the service, that customer remains responsible for deciding why the data is processed.",
    ],
  },
  {
    title: "2. Who this policy applies to",
    paragraphs: [
      "This policy applies to website visitors, prospective customers, customer administrators, authorized users, and individuals whose data is included in customer-submitted records.",
      "If your employer or another organization gives you access to Qeemly, that organization may separately explain how your data is collected and used within its own HR, finance, or compensation processes.",
    ],
  },
  {
    title: "3. Data we collect",
    bullets: [
      "Identity and contact details, such as your name, work email address, company name, job title, and support or sales correspondence.",
      "Account and usage information, such as login activity, device/browser information, IP address, session data, and product interaction history.",
      "Customer Data uploaded to the service, including compensation records, job levels, role mappings, location data, workforce planning inputs, and related internal notes or approval data.",
      "Website and marketing information, including cookie-related signals, page visits, and campaign attribution where permitted by applicable law.",
    ],
  },
  {
    title: "4. How we use personal data",
    bullets: [
      "To provide, secure, and support the Qeemly platform and related services.",
      "To create and deliver compensation benchmarks, analytics, reports, and workflow outputs requested by customers.",
      "To authenticate users, prevent misuse, investigate incidents, and protect the confidentiality and integrity of the service.",
      "To communicate about onboarding, support, service updates, product changes, legal notices, and commercial requests.",
      "To improve our products, infrastructure, reporting quality, and customer experience.",
      "To comply with applicable legal, regulatory, tax, accounting, or law enforcement obligations.",
    ],
  },
  {
    title: "5. Our role and the customer's role",
    paragraphs: [
      "When Qeemly processes account, billing, support, and website information for its own business operations, Qeemly acts as the controller of that personal data.",
      "When a customer uploads employee, candidate, or compensation data into Qeemly, the customer is the controller and Qeemly generally acts as a processor or service provider, processing data on the customer's documented instructions and the applicable commercial agreement.",
    ],
  },
  {
    title: "6. Legal bases and permissions",
    paragraphs: [
      "Qeemly processes personal data where processing is necessary to provide the service, enter into or perform a contract, comply with legal obligations, protect the service and our customers, or where consent has been provided. In the UAE and across the GCC, the exact legal characterization may vary depending on the applicable privacy framework, the source of the data, and the parties involved.",
      "If consent is required for a specific activity, such as optional marketing communications, you can withdraw that consent at any time without affecting prior lawful processing.",
    ],
  },
  {
    title: "7. Sharing personal data",
    bullets: [
      "Cloud hosting, infrastructure, analytics, communications, identity, and support vendors who help us operate the platform under confidentiality and security obligations.",
      "Professional advisers, auditors, insurers, and legal counsel where necessary for business operations, disputes, or compliance.",
      "Authorities, regulators, courts, or law enforcement where disclosure is required or reasonably necessary under applicable law.",
      "A purchaser, investor, or successor entity in connection with a merger, financing, acquisition, restructuring, or sale of assets, subject to appropriate confidentiality controls.",
    ],
  },
  {
    title: "8. Cross-border processing",
    paragraphs: [
      "Qeemly supports customers operating in the UAE and the GCC, and personal data may be processed in the UAE or in other jurisdictions where our approved service providers operate. Where cross-border transfers occur, we use contractual, organizational, and technical safeguards designed to protect the data and keep the transfer proportionate to the service being delivered.",
      "Customers with localization or residency requirements should raise them during procurement or onboarding so they can be addressed in the relevant order form or implementation scope.",
    ],
  },
  {
    title: "9. Retention",
    paragraphs: [
      "We retain personal data only for as long as reasonably necessary to deliver the service, satisfy contractual commitments, resolve disputes, maintain security records, and comply with legal or regulatory obligations.",
      "Retention periods differ depending on the nature of the data, the customer relationship, legal requirements, and whether data must be preserved for support, audit, or incident response purposes.",
    ],
  },
  {
    title: "10. Security",
    paragraphs: [
      "Qeemly uses administrative, technical, and organizational measures designed to protect personal data against unauthorized access, loss, misuse, alteration, or disclosure. Those measures include access controls, environment segregation, logging, vendor oversight, and security practices appropriate to the sensitivity of compensation and workforce information.",
      "No internet-based system can be guaranteed to be fully secure, so customers and users should also maintain appropriate password hygiene, access controls, and internal governance.",
    ],
  },
  {
    title: "11. Your rights",
    paragraphs: [
      "Subject to applicable UAE and GCC legal requirements, individuals may have rights to request access to personal data, request correction, request deletion, object to certain processing, restrict use in specific cases, or withdraw consent where processing depends on consent.",
      "If Qeemly processes your data on behalf of one of our customers, we may direct your request to that customer so it can assess and respond in line with its own obligations.",
    ],
  },
  {
    title: "12. Children",
    paragraphs: [
      "Qeemly is intended for business users and is not directed to children. We do not knowingly collect personal data from children in connection with the service.",
    ],
  },
  {
    title: "13. Changes and contact",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect product, legal, or operational changes. When we make material changes, we will update the effective date and take reasonable steps to notify customers where appropriate.",
      "For privacy questions, requests, or complaints, contact us at hello@qeemly.com or through our contact page.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">Legal</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">Privacy Policy</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-brand-700">
          Effective date: {new Date().toLocaleDateString("en-GB")}. This policy is written for a UAE-based compensation
          platform serving organizations across the GCC.
        </p>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-brand-50/40 px-6 py-6 text-sm leading-7 text-brand-800 sm:px-10">
        If your organization uses Qeemly to upload employee or compensation records, your organization controls those
        records and decides why they are processed. Qeemly processes that Customer Data to operate the service and meet
        the customer&apos;s instructions.
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
          if you need help with a privacy question or a data request.
        </p>
      </section>
    </div>
  );
}
