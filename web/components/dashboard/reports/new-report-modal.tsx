"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Layers,
  FileSignature,
  Share2,
  ArrowRight,
  Plus,
} from "lucide-react";

type NewReportModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: () => void;
  onCreateCustom: () => void;
};

export function NewReportModal({
  open,
  onClose,
  onSelectTemplate,
  onCreateCustom,
}: NewReportModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_180ms_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Create new report"
          tabIndex={-1}
          className="relative w-full max-w-3xl rounded-3xl border border-border bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] outline-none animate-[popIn_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-6">
            <h2 className="text-xl font-bold text-brand-900">
              Create new report
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-accent-500 hover:bg-accent-100 hover:text-brand-900 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Two option cards */}
          <div className="grid grid-cols-1 gap-5 px-8 pb-8 sm:grid-cols-2">
            {/* Use a Template */}
            <div className="flex flex-col rounded-2xl border border-border p-6">
              <h3 className="text-center text-lg font-bold text-brand-900">
                Use a Template
              </h3>
              <p className="mt-2 text-center text-xs leading-relaxed text-accent-500">
                Choose from a list of pre built, easy to use templates. You can
                even use a custom report you have built before. Lorem ipsum
                dolore sed amet.
              </p>

              <div className="mt-6 space-y-4">
                <Feature
                  icon={<Layers className="h-4 w-4" />}
                  label="Save time"
                />
                <Feature
                  icon={<FileSignature className="h-4 w-4" />}
                  label="Justo tellus vestibulum aenean"
                />
                <Feature
                  icon={<Share2 className="h-4 w-4" />}
                  label="Re-use custom reports"
                />
              </div>

              <button
                type="button"
                onClick={onSelectTemplate}
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                Select Template
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Create Custom Report */}
            <div className="flex flex-col rounded-2xl border border-border p-6">
              <h3 className="text-center text-lg font-bold text-brand-900">
                Create Custom Report
              </h3>
              <p className="mt-2 text-center text-xs leading-relaxed text-accent-500">
                Mix benchmarks, workforce compliance controls, and pay governance summaries into
                a single narrative. Save layouts for recurring board packs.
              </p>

              <div className="mt-6 space-y-4">
                <Feature
                  icon={<Layers className="h-4 w-4" />}
                  label="Drag and drop blocks"
                />
                <Feature
                  icon={<FileSignature className="h-4 w-4" />}
                  label="Collaboration notes"
                />
                <Feature
                  icon={<Share2 className="h-4 w-4" />}
                  label="Direct stakeholder sharing"
                />
              </div>

              <button
                type="button"
                onClick={onCreateCustom}
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                Create Custom Report
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
        {icon}
      </span>
      <span className="text-xs font-medium text-accent-600">{label}</span>
    </div>
  );
}
