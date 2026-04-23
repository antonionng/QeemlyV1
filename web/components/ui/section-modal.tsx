"use client";

import { ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X } from "lucide-react";

type SectionModalProps = {
  title: string;
  subtitle?: string;
  triggerLabel: string;
  triggerVariant?: "link" | "button" | "bare";
  triggerClassName?: string;
  triggerProps?: Record<string, string | number | boolean>;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidthClassName?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
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
  triggerClassName,
  triggerProps,
  icon,
  children,
  className,
  maxWidthClassName = "max-w-3xl",
}: SectionModalProps) {
  const modalId = useId();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const canPortal = typeof document !== "undefined";

  const closeModal = useCallback(() => {
    triggerRef.current?.focus();
    setOpen(false);
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusableElements = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");

    if (focusableElements.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (activeElement === first || activeElement === panel) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

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
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      trapFocus(e);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeModal, open, trapFocus]);

  // Initial focus
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const trigger = useMemo(() => {
    if (triggerVariant === "bare") {
      return (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className={clsx("cursor-pointer", triggerClassName)}
          {...triggerProps}
        >
          {triggerLabel}
        </button>
      );
    }

    if (triggerVariant === "button") {
      return (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className={clsx(
            "inline-flex cursor-pointer items-center justify-center rounded-full border border-brand-400/30 bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(92,69,253,0.28)]",
            "transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-[0_16px_36px_rgba(92,69,253,0.34)] active:translate-y-px active:scale-[0.98]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300",
            triggerClassName,
          )}
          {...triggerProps}
        >
          {triggerLabel}
        </button>
      );
    }

    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-500",
          "hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300",
          triggerClassName,
        )}
        {...triggerProps}
      >
        {triggerLabel}
      </button>
    );
  }, [triggerClassName, triggerLabel, triggerProps, triggerVariant]);

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
                tabIndex={-1}
                className={clsx(
                  "absolute inset-0 bg-black/30 backdrop-blur-[2px]",
                  prefersReducedMotion ? "" : "animate-[fadeIn_180ms_ease-out]",
                )}
                onClick={closeModal}
              />

              {/* Panel */}
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${modalId}-title`}
                  aria-describedby={subtitle ? `${modalId}-subtitle` : undefined}
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
                            {subtitle ? (
                              <p id={`${modalId}-subtitle`} className="mt-1 text-sm text-brand-600">
                                {subtitle}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={closeModal}
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






