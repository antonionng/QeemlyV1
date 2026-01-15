"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

type MobileSidebarDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

function getFocusable(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

export function MobileSidebarDrawer({ open, onOpenChange, returnFocusRef }: MobileSidebarDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const labelledById = useMemo(() => "dash-mobile-nav-title", []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      if (e.key !== "Tab") return;
      const focusables = getFocusable(panelRef.current);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!active || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) return;
    returnFocusRef?.current?.focus?.();
  }, [open, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby={labelledById}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-900/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={clsx(
          "absolute left-0 top-0 h-full w-[85vw] max-w-[320px]",
          "bg-white/95 backdrop-blur-xl",
          "border-r border-border/50",
          "shadow-2xl shadow-brand-900/10",
          "animate-in slide-in-from-left duration-300",
        )}
      >
        {/* Close button overlay */}
        <button
          ref={closeBtnRef}
          type="button"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100/70 text-brand-800/80 transition-colors hover:bg-brand-200/70 focus-visible:outline-none"
          aria-label="Close menu"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Full sidebar content */}
        <div id={labelledById} className="sr-only">Navigation menu</div>
        <div className="h-full">
          <DashboardSidebar collapsed={false} onNavigate={() => onOpenChange(false)} />
        </div>
      </div>
    </div>
  );
}
