"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type IntegrationContactModalProps = {
  providerName: string;
  onClose: () => void;
};

function buildMailtoHref(providerName: string) {
  const subject = encodeURIComponent(`Integration request: ${providerName}`);
  const body = encodeURIComponent(
    [
      "Hi Qeemly,",
      "",
      `We would love to connect ${providerName} to our workspace.`,
      "",
      "Company:",
      "Use case:",
      "",
      "Thanks!",
    ].join("\n"),
  );

  return `mailto:hello@qeemly.com?subject=${subject}&body=${body}`;
}

export function IntegrationContactModal({
  providerName,
  onClose,
}: IntegrationContactModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close integration contact modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_180ms_ease-out]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="integration-contact-modal-title"
          tabIndex={-1}
          className={clsx(
            "relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] outline-none animate-[popIn_200ms_cubic-bezier(0.2,0.8,0.2,1)]",
          )}
        >
          <div className="h-1.5 bg-brand-500" />

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-border">
                  <Sparkles className="h-5 w-5 text-brand-500" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="integration-contact-modal-title"
                    className="text-xl font-bold text-brand-900 sm:text-2xl"
                  >
                    Connect {providerName}
                  </h3>
                  <p className="mt-1 text-sm text-brand-600">
                    A little white-glove magic. We will help you get this one wired up.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-600 hover:bg-muted hover:text-brand-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm leading-relaxed text-text-secondary">
                We will help you get this one wired up for your team. Send us a note with your
                setup and we will take it from there.
              </p>

              <div className="rounded-2xl border border-border bg-surface-1 p-4 text-sm text-text-secondary">
                Fastest route: tell us the system, your use case, and whether you want a native
                setup, API workflow, or file-based sync.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={buildMailtoHref(providerName)}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6C5CE7,#5A4BE7)] px-4 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:brightness-[1.02] hover:shadow-md active:brightness-95"
                >
                  Contact us
                </a>
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Maybe later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
