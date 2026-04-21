"use client";

import clsx from "clsx";
import { FieldTooltip } from "@/components/ui/field-tooltip";

export type VisaBadgeStatus = "valid" | "expiring-90" | "expiring-60" | "expiring-30";

const TOOLTIP_COPY: Record<VisaBadgeStatus, string> = {
  "valid": "Valid: visa is on file and expires more than 90 days from today.",
  "expiring-90": "Expiring <=90d: visa expires within 90 days. Renewal planning recommended.",
  "expiring-60": "Expiring <=60d: visa expires within 60 days. Start renewal as soon as possible.",
  "expiring-30": "Expiring <=30d: visa expires within 30 days. Action required immediately.",
};

export type VisaBadgeInfo = {
  status: VisaBadgeStatus;
  label: string;
  cls: string;
};

export function classifyVisa(expiry: Date | null | undefined): VisaBadgeInfo | null {
  if (!expiry) return null;
  const days = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 30) {
    return { status: "expiring-30", label: "Expiring <=30d", cls: "bg-red-50 text-red-700 border-red-200" };
  }
  if (days <= 60) {
    return { status: "expiring-60", label: "Expiring <=60d", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  }
  if (days <= 90) {
    return { status: "expiring-90", label: "Expiring <=90d", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { status: "valid", label: "Valid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

type VisaBadgeProps = {
  visa: VisaBadgeInfo;
  className?: string;
};

export function VisaBadge({ visa, className }: VisaBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        visa.cls,
        className,
      )}
    >
      {visa.label}
      <FieldTooltip message={TOOLTIP_COPY[visa.status]} className="ml-0.5 h-3 w-3" />
    </span>
  );
}

export const VISA_TOOLTIP_COPY = TOOLTIP_COPY;
