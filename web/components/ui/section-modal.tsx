"use client";

import { ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X } from "lucide-react";

type SectionModalProps = {
  title: string;
  subtitle?: string;
  triggerLabel: string;
  triggerVariant?: "link" | "button";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidthClassName?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(mq.matches));
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function SectionModal({
  title,
  subtitle,
  triggerLabel,
  triggerVariant = "link",
  icon,
  children,
  className,
  maxWidthClassName = "max-w-3xl",
}: SectionModalProps) {
  const modalId = useId();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const canPortal = typeof document !== "undefined";

  // Body scroll lock when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Initial focus
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const trigger = useMemo(() => {
    if (triggerVariant === "button") {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={clsx(
            "inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white",
            "hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300",
          )}
        >
          {triggerLabel}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex items-center gap-2 text-sm font-semibold text-brand-500",
          "hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300",
        )}
      >
        {triggerLabel}
      </button>
    );
  }, [triggerLabel, triggerVariant]);

  return (
    <div className={clsx("inline-flex", className)}>
      {trigger}

      {open && canPortal
        ? createPortal(
            <div className="fixed inset-0 z-[90]">
              {/* Backdrop */}
              <button
                type="button"
                aria-label="Close modal"
                className={clsx(
                  "absolute inset-0 bg-black/30 backdrop-blur-[2px]",
                  prefersReducedMotion ? "" : "animate-[fadeIn_180ms_ease-out]",
                )}
                onClick={() => setOpen(false)}
              />

              {/* Panel */}
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${modalId}-title`}
                  tabIndex={-1}
                  ref={panelRef}
                  className={clsx(
                    "relative w-full",
                    maxWidthClassName,
                    "overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)]",
                    "outline-none",
                    prefersReducedMotion ? "" : "animate-[popIn_200ms_cubic-bezier(0.2,0.8,0.2,1)]",
                  )}
                >
                  {/* Top accent (part of layout, prevents overlap) */}
                  <div className="h-1.5 bg-brand-500" />

                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          {icon ? (
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-border">
                              {icon}
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <h3
                              id={`${modalId}-title`}
                              className="truncate text-xl font-bold text-brand-900 sm:text-2xl"
                            >
                              {title}
                            </h3>
                            {subtitle ? <p className="mt-1 text-sm text-brand-600">{subtitle}</p> : null}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "inline-flex h-10 w-10 items-center justify-center rounded-full",
                          "text-brand-600 hover:bg-muted hover:text-brand-900",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300",
                        )}
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-6">{children}</div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}






