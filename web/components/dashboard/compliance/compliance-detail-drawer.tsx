"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, FileText, Scale, Clock, Users, Plane, Shield, CheckCircle2 } from "lucide-react";
import type {
  DrawerContent,
  RiskItem,
  PolicyItem,
  RegulatoryUpdate,
  DeadlineItem,
  VisaTimelineItem,
  DocumentItem,
  AuditLogItem,
} from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";
import { FieldTooltip } from "@/components/ui/field-tooltip";
import clsx from "clsx";

type Props = {
  content: DrawerContent;
  onClose: () => void;
};

export function ComplianceDetailDrawer({ content, onClose }: Props) {
  const { deadlineItems, visaTimeline, documentItems, auditLogItems } = useComplianceContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!content) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [content]);

  useEffect(() => {
    if (!content) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [content, onClose]);

  useEffect(() => {
    if (content) panelRef.current?.focus();
  }, [content]);

  if (!content || typeof document === "undefined") return null;

  const title = drawerTitle(content);

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md flex flex-col bg-white shadow-[0_0_60px_rgba(0,0,0,0.12)] outline-none animate-[slideInRight_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-lg font-bold text-brand-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent-500 hover:bg-accent-100 hover:text-brand-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 widget-scroll">
          <DrawerBody
            content={content}
            deadlineItems={deadlineItems}
            visaTimeline={visaTimeline}
            documentItems={documentItems}
            auditLogItems={auditLogItems}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

function drawerTitle(content: NonNullable<DrawerContent>): string {
  switch (content.type) {
    case "risk": return content.item.area;
    case "policy": return content.item.name;
    case "update": return content.item.title;
    case "deadline": return content.item.title;
    case "visa": return content.item.title;
    case "document": return content.item.name;
    case "audit": return content.item.action;
    case "deadlines-all": return "All Deadlines";
    case "visa-all": return "Visa & Permits";
    case "documents-all": return "All Documents";
    case "audit-all": return "Full Audit Log";
  }
}

function DrawerBody({
  content,
  deadlineItems,
  visaTimeline,
  documentItems,
  auditLogItems,
}: {
  content: NonNullable<DrawerContent>;
  deadlineItems: DeadlineItem[];
  visaTimeline: VisaTimelineItem[];
  documentItems: DocumentItem[];
  auditLogItems: AuditLogItem[];
}) {
  switch (content.type) {
    case "risk": return <RiskDetail item={content.item} />;
    case "policy": return <PolicyDetail item={content.item} />;
    case "update": return <UpdateDetail item={content.item} />;
    case "deadline": return <DeadlineDetail item={content.item} />;
    case "visa": return <VisaDetail item={content.item} />;
    case "document": return <DocDetail item={content.item} />;
    case "audit": return <AuditDetail item={content.item} />;
    case "deadlines-all": return <AllDeadlines deadlineItems={deadlineItems} />;
    case "visa-all": return <AllVisa visaTimeline={visaTimeline} />;
    case "documents-all": return <AllDocuments documentItems={documentItems} />;
    case "audit-all": return <AllAudit auditLogItems={auditLogItems} />;
  }
}

/* ── Individual detail views ── */

function riskColors(level: number) {
  if (level > 70) return { badge: "bg-red-50 text-red-600", icon: "text-red-500" };
  if (level > 40) return { badge: "bg-amber-50 text-amber-600", icon: "text-amber-500" };
  return { badge: "bg-emerald-50 text-emerald-600", icon: "text-emerald-500" };
}

function RiskDetail({ item }: { item: RiskItem }) {
  const colors = riskColors(item.level);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className={clsx("rounded-full px-3 py-1 text-xs font-bold", colors.badge)}>
          {item.status} &mdash; {item.level}% Risk
        </span>
        <AlertTriangle className={clsx("h-5 w-5", colors.icon)} />
      </div>
      <p className="text-sm leading-relaxed text-accent-600">{item.description}</p>
      <Section title="Recommended Actions">
        <ul className="list-disc pl-5 space-y-2 text-sm text-accent-600">
          <li>Review and update relevant documentation</li>
          <li>Schedule compliance audit for this area</li>
          <li>Assign responsible team member for remediation</li>
        </ul>
      </Section>
    </div>
  );
}

function PolicyDetail({ item }: { item: PolicyItem }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-brand-500" />
        <span className={clsx("rounded-full px-3 py-1 text-xs font-bold border",
          item.status === "Success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
          item.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
          "bg-red-50 text-red-600 border-red-100"
        )}>
          {item.rate}% Signed
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent-100">
        <div className={clsx("h-full",
          item.status === "Success" ? "bg-emerald-500" :
          item.status === "Pending" ? "bg-amber-500" : "bg-red-500"
        )} style={{ width: `${item.rate}%` }} />
      </div>
      <Section title="Policy Details">
        <p className="text-sm text-accent-600">
          This policy requires acknowledgment from all active employees. Current completion rate is {item.rate}%.
        </p>
      </Section>
      <Section title="Outstanding Signatories">
        <p className="text-sm text-accent-500 italic">
          {item.rate < 100 ? `${100 - item.rate}% of employees have not yet signed this policy.` : "All employees have signed."}
        </p>
      </Section>
    </div>
  );
}

function UpdateDetail({ item }: { item: RegulatoryUpdate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-5 w-5 text-brand-600" />
        <span className="text-xs font-bold text-accent-500 uppercase">{item.jurisdiction}</span>
        <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold border ml-auto",
          item.impact === "High" ? "bg-red-50 text-red-600 border-red-100" :
          item.impact === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
          "bg-blue-50 text-blue-600 border-blue-100"
        )}>{item.impact} Impact</span>
      </div>
      <p className="text-sm leading-relaxed text-accent-600">{item.description}</p>
      <div className="flex items-center gap-4 text-xs text-accent-500">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.date}</span>
        <span className="flex items-center gap-1">
          {item.status === "Active" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5" />}
          {item.status}
        </span>
      </div>
      <Section title="Action Required">
        <p className="text-sm text-accent-600">Review this regulatory change and update internal processes accordingly.</p>
      </Section>
    </div>
  );
}

function DeadlineDetail({ item }: { item: DeadlineItem }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-brand-500" />
        <span className="text-sm font-bold text-brand-900">{item.date}</span>
        <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold ml-auto",
          item.type === "Urgent" ? "bg-red-50 text-red-500" :
          item.type === "Mandatory" ? "bg-amber-50 text-amber-600" : "bg-accent-100 text-accent-500"
        )}>{item.type}</span>
      </div>
      <Section title="Details">
        <p className="text-sm text-accent-600">Ensure this deadline is met to maintain full regulatory compliance.</p>
      </Section>
    </div>
  );
}

function VisaDetail({ item }: { item: VisaTimelineItem }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Plane className="h-5 w-5 text-brand-500" />
        <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold",
          item.type === "Critical" ? "bg-red-50 text-red-500" :
          item.type === "Success" ? "bg-emerald-50 text-emerald-500" : "bg-brand-50 text-brand-500"
        )}>{item.type}</span>
      </div>
      <p className="text-sm text-accent-600">{item.description}</p>
      <Section title="Next Steps">
        <p className="text-sm text-accent-600">Follow up with the relevant department to ensure timely processing.</p>
      </Section>
    </div>
  );
}

function DocDetail({ item }: { item: DocumentItem }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-brand-500" />
        <span className="text-xs text-accent-500">{item.docType} &bull; {item.size}</span>
        <span className={clsx("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ml-auto",
          item.status === "Expiring" ? "bg-red-50 text-red-500" :
          item.status === "Review" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {item.status}
          <FieldTooltip
            message={
              item.status === "Expiring"
                ? "Expiring: document falls inside the renewal window (<=60 days). Action recommended."
                : item.status === "Review"
                  ? "Review: document needs verification before it can be marked Valid."
                  : "Valid: document is on file and not within the renewal window."
            }
            className="h-3 w-3"
          />
        </span>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs text-accent-500">Expiry Date</p>
        <p className="text-sm font-bold text-brand-900">{item.expiry}</p>
      </div>
      <Section title="Actions">
        <p className="text-sm text-accent-600">Download, view, or initiate renewal for this document.</p>
      </Section>
    </div>
  );
}

function AuditDetail({ item }: { item: AuditLogItem }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs text-accent-500">Action</p>
        <p className="text-sm font-bold text-brand-900">{item.action}</p>
        <p className="mt-2 text-xs text-accent-500">Target</p>
        <p className="text-sm text-brand-900">{item.target}</p>
        <p className="mt-2 text-xs text-accent-500">Performed by</p>
        <p className="text-sm text-brand-900">{item.user}</p>
        <p className="mt-2 text-xs text-accent-500">When</p>
        <p className="text-sm text-brand-900">{item.time}</p>
      </div>
    </div>
  );
}

/* ── "View All" list views ── */

function AllDeadlines({ deadlineItems }: { deadlineItems: DeadlineItem[] }) {
  return (
    <div className="space-y-3">
      {deadlineItems.map((d) => (
        <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="flex flex-col items-center rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-600">
            <span className="text-[10px] font-bold uppercase">{d.date.split(" ")[0]}</span>
            <span className="text-xs font-bold">{d.date.split(" ")[1]}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-brand-900">{d.title}</p>
            <p className={clsx("text-[10px] font-semibold uppercase",
              d.type === "Urgent" ? "text-red-500" : d.type === "Mandatory" ? "text-amber-600" : "text-accent-400"
            )}>{d.type}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllVisa({ visaTimeline }: { visaTimeline: VisaTimelineItem[] }) {
  return (
    <div className="space-y-3">
      {visaTimeline.map((v) => (
        <div key={v.id} className="rounded-lg border border-border p-3">
          <p className="text-xs font-bold text-brand-900">{v.title}</p>
          <p className="mt-1 text-[11px] text-accent-500">{v.description}</p>
        </div>
      ))}
    </div>
  );
}

function AllDocuments({ documentItems }: { documentItems: DocumentItem[] }) {
  return (
    <div className="space-y-3">
      {documentItems.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-accent-400" />
            <div>
              <p className="text-xs font-bold text-brand-900">{doc.name}</p>
              <p className="text-[10px] text-accent-500">{doc.docType} &bull; {doc.size}</p>
            </div>
          </div>
          <span className={clsx("text-[11px] font-medium", doc.status === "Expiring" ? "text-red-500" : "text-brand-700")}>{doc.expiry}</span>
        </div>
      ))}
    </div>
  );
}

function AllAudit({ auditLogItems }: { auditLogItems: AuditLogItem[] }) {
  return (
    <div className="space-y-3">
      {auditLogItems.map((log) => (
        <div key={log.id} className="rounded-lg border border-border p-3">
          <p className="text-xs font-bold text-brand-900">{log.action}: <span className="font-medium text-accent-600">{log.target}</span></p>
          <p className="mt-1 text-[10px] text-accent-500">By {log.user} &bull; {log.time}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-brand-900 uppercase tracking-tight mb-2">{title}</h4>
      {children}
    </div>
  );
}
