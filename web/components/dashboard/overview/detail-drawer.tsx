"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { OverviewMetricDrawerContent } from "@/lib/dashboard/overview-interactions";

type OverviewDetailDrawerProps = {
  content: OverviewMetricDrawerContent | null;
  onClose: () => void;
};

export function OverviewDetailDrawer({ content, onClose }: OverviewDetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!content) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [content]);

  useEffect(() => {
    if (!content) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [content, onClose]);

  useEffect(() => {
    if (content) {
      panelRef.current?.focus();
    }
  }, [content]);

  if (!content || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close detail drawer"
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        tabIndex={-1}
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-[0_0_60px_rgba(0,0,0,0.12)] outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
              {content.eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-bold text-brand-900">{content.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent-500 transition-colors hover:bg-accent-100 hover:text-brand-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-2xl border border-border bg-[#F8FAFC] p-5">
            <p className="text-xs font-medium text-accent-500">{content.metricLabel}</p>
            <p className="mt-2 text-[40px] font-bold leading-none text-brand-900">
              {content.metricValue}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-accent-600">{content.summary}</p>
          </div>

          <div className="mt-6 space-y-3">
            {content.sections.map((section) => (
              <div
                key={section.label}
                className="rounded-2xl border border-border bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{section.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-accent-600">
                      {section.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-bold text-brand-900">
                    {section.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
